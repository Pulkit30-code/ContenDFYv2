import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { isSessionExpiredError, requireAuthenticatedServerContext } from "@/lib/auth";
import { getSlackEnv, getSlackRedirectUrl } from "@/lib/env";
import { createAdminClient } from "@/supabase/server";

type SlackResponse = { ok: boolean; error?: string; needed?: string; provided?: string; [key: string]: unknown };
export type SlackChannel = { id: string; name: string; is_private: boolean; is_archived?: boolean };
export type SlackIntegrationRecord = Record<string, unknown> & { id: string; workspace_id: string };
export type WorkspaceAccess = {
  workspaceId: string;
  workspace: Record<string, unknown>;
  profile: Record<string, unknown>;
  membershipRole: string | null;
  user: { id: string; email: string | null };
};

function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function stringField(value: unknown, key: string) { const result = asRecord(value)[key]; return typeof result === "string" ? result : ""; }
function encode(value: Buffer) { return value.toString("base64url"); }
function decode(value: string) { return Buffer.from(value, "base64url"); }
function encryptionKey() { return createHash("sha256").update(getSlackEnv().SLACK_TOKEN_ENCRYPTION_KEY, "utf8").digest(); }

export function encryptSlackToken(token: string) {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  // Keep the format compatible with the existing Slack rows: version, IV, ciphertext, auth tag.
  return `v1:${encode(iv)}:${encode(ciphertext)}:${encode(cipher.getAuthTag())}`;
}

export function decryptSlackToken(ciphertext: string) {
  const key = encryptionKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Unsupported Slack token format");
  const decipher = createDecipheriv("aes-256-gcm", key, decode(parts[1]));
  decipher.setAuthTag(decode(parts[3]));
  return Buffer.concat([decipher.update(decode(parts[2])), decipher.final()]).toString("utf8");
}

function hashState(state: string) { return createHash("sha256").update(state).digest("hex"); }

// The Supabase generated schema intentionally keeps production rows generic.
// Keep this one untyped boundary server-side so the secrets never cross to the browser.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function table(name: string): any { return (createAdminClient() as unknown as { from: (name: string) => any }).from(name); }

export async function getWorkspaceForUser(userId: string, requestedWorkspaceId?: string) {
  const requestedId = requestedWorkspaceId?.trim() || "";
  const auth = await requireAuthenticatedServerContext("Slack workspace resolution", requestedId || null);
  if (auth.user.id !== userId) throw new Error("The authenticated user changed. Please sign in again.");
  const { data: workspaceRows, error: workspaceError } = await auth.supabase.from("workspaces").select("id,name,owner_id").order("created_at", { ascending: true });
  if (workspaceError) throw new Error("Unable to load your workspace access. Please sign in again or contact your workspace administrator.");
  const workspaces = (workspaceRows ?? []) as Array<Record<string, unknown>>;
  const selectedWorkspace = requestedId ? workspaces.find((workspace) => String(workspace.id ?? "") === requestedId) : workspaces[0];
  if (!selectedWorkspace?.id) {
    if (requestedId) throw new Error("The selected workspace is unavailable. Please select an active workspace before connecting Slack.");
    throw new Error("No active workspace found. Please create or select a workspace before connecting Slack.");
  }
  const workspaceId = String(selectedWorkspace.id);
  const { data: membership, error: membershipError } = await auth.supabase.from("workspace_memberships").select("workspace_id,user_id,role,is_active").eq("workspace_id", workspaceId).eq("user_id", auth.user.id).maybeSingle();
  const isOwner = String(selectedWorkspace.owner_id ?? "") === auth.user.id;
  const isActiveMember = Boolean(membership) && asRecord(membership).is_active !== false;
  if (membershipError || (!isOwner && !isActiveMember)) throw new Error("You do not have access to this workspace.");
  const { data: profile, error: profileError } = await auth.supabase.from("profiles").select("id,workspace_id,full_name,email").eq("id", auth.user.id).maybeSingle();
  void profileError;
  return { workspaceId, workspace: selectedWorkspace, profile: asRecord(profile), membershipRole: stringField(membership, "role") || null, user: auth.user } satisfies WorkspaceAccess;
}

export async function findSlackIntegration(workspaceId: string) {
  const { data, error } = await table("slack_integrations").select("*").eq("workspace_id", workspaceId).maybeSingle();
  if (error) throw new Error(`Unable to load Slack connection: ${error.message}`);
  return (data as SlackIntegrationRecord | null) ?? null;
}

export async function saveSlackIntegration(workspaceId: string, input: Record<string, unknown>) {
  const existing = await findSlackIntegration(workspaceId);
  if (existing) {
    const { data, error } = await table("slack_integrations").update(input).eq("id", existing.id).select("*").single();
    if (error) throw new Error(`Unable to save Slack connection: ${error.message}`);
    return data as SlackIntegrationRecord;
  }
  const { data, error } = await table("slack_integrations").insert({ workspace_id: workspaceId, ...input }).select("*").single();
  if (error) throw new Error(`Unable to save Slack connection: ${error.message}`);
  return data as SlackIntegrationRecord;
}

export async function deleteOAuthState(state: string) {
  const { data, error } = await table("slack_oauth_states").select("*").eq("state_hash", hashState(state)).maybeSingle();
  if (error) throw new Error(`Unable to validate Slack OAuth state: ${error.message}`);
  if (!data) throw new Error("This Slack authorization link is invalid or has expired.");
  const expiresAt = Date.parse(stringField(data, "expires_at"));
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || data.consumed_at) throw new Error("This Slack authorization link is invalid or has expired.");
  const { error: consumeError } = await table("slack_oauth_states").update({ consumed_at: new Date().toISOString() }).eq("id", stringField(data, "id"));
  if (consumeError) throw new Error(`Unable to consume Slack OAuth state: ${consumeError.message}`);
  return data as Record<string, unknown>;
}

export async function createOAuthState(access: WorkspaceAccess) {
  const { workspaceId, user } = access;
  const state = randomBytes(32).toString("base64url");
  getSlackEnv();
  const insertPayload = { workspace_id: workspaceId, requested_by: user.id, state_hash: hashState(state), redirect_uri: getSlackRedirectUrl(), expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() };
  const { error } = await table("slack_oauth_states").insert(insertPayload).select("id").single();
  if (error) throw new Error(`Unable to start Slack authorization: ${error.message}`);
  return state;
}

export async function slackApi<T extends SlackResponse>(token: string, method: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Slack network error (${response.status})`);
  const payload = await response.json() as T;
  if (!payload.ok) {
    const detail = payload.error === "missing_scope" && payload.needed ? `Missing Slack scope: ${payload.needed}` : payload.error ?? "Slack API request failed";
    const error = new Error(detail); error.name = payload.error ?? "slack_api_error"; throw error;
  }
  return payload;
}

export async function getSlackSnapshot(integration: SlackIntegrationRecord) {
  const token = decryptSlackToken(stringField(integration, "bot_token_ciphertext"));
  const auth = await slackApi<SlackResponse>(token, "auth.test");
  let team: SlackResponse = { ok: true };
  try { team = await slackApi<SlackResponse>(token, "team.info"); } catch (error) { if (!(error instanceof Error) || error.name !== "missing_scope") throw error; }
  const teamData = asRecord(team.team);
  const icon = asRecord(teamData.icon);
  return { workspaceName: stringField(teamData, "name") || stringField(integration, "slack_team_name"), workspaceIcon: stringField(icon, "image_132") || stringField(icon, "image_68") || "", workspaceId: stringField(teamData, "id") || stringField(integration, "slack_team_id"), botName: stringField(auth, "user") || stringField(auth, "bot_id"), botStatus: "Active", botUserId: stringField(auth, "user_id") || stringField(integration, "bot_user_id") };
}

export async function listSlackChannels(integration: SlackIntegrationRecord) {
  const token = decryptSlackToken(stringField(integration, "bot_token_ciphertext"));
  const result = await slackApi<SlackResponse & { channels?: SlackChannel[] }>(token, "conversations.list", { types: "public_channel,private_channel", exclude_archived: true, limit: 200 });
  return (result.channels ?? []).map((channel) => ({ id: channel.id, name: channel.name, is_private: Boolean(channel.is_private), is_archived: Boolean(channel.is_archived) })).sort((a, b) => a.name.localeCompare(b.name));
}

export function slackErrorMessage(error: unknown) {
  if (isSessionExpiredError(error)) return "Your session has expired. Please sign in again.";
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : "Slack is temporarily unavailable.";
  if (["invalid_auth", "token_revoked", "account_inactive"].includes(name)) return "Slack token is no longer valid. Reconnect this workspace.";
  if (name === "missing_scope" || /Missing Slack scope/i.test(message)) return message;
  if (["channel_not_found", "not_in_channel"].includes(name)) return "The selected Slack channel is unavailable. Choose another channel.";
  if (name === "team_access_not_granted") return "This Slack workspace removed ContenDFY. Reconnect to continue.";
  if (/network error/i.test(message)) return "Slack could not be reached. Check the connection and try again.";
  return message;
}

export { hashState };
