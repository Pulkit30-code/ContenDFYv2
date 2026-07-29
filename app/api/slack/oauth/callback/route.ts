import { NextResponse } from "next/server";
import { getSlackEnv, getSlackRedirectUrl } from "@/lib/env";
import { deleteOAuthState, encryptSlackToken, saveSlackIntegration, slackApi } from "@/lib/slack/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const target = new URL("/workspace/settings", request.url);
  try {
    const params = new URL(request.url).searchParams;
    const oauthError = params.get("error");
    if (oauthError) throw new Error(params.get("error_description") || `Slack authorization failed: ${oauthError}`);
    const state = params.get("state");
    const code = params.get("code");
    if (!state || !code) throw new Error("Slack did not return a valid authorization code.");
    const stateRecord = await deleteOAuthState(state);
    const env = getSlackEnv();
    const response = await fetch("https://slack.com/api/oauth.v2.access", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: env.SLACK_CLIENT_ID, client_secret: env.SLACK_CLIENT_SECRET, code, redirect_uri: getSlackRedirectUrl() }), cache: "no-store" });
    if (!response.ok) throw new Error(`Slack token exchange failed (${response.status}).`);
    const payload = await response.json() as Record<string, unknown>;
    if (!payload.ok || typeof payload.access_token !== "string") throw new Error(typeof payload.error === "string" ? payload.error : "Slack token exchange failed.");
    const token = payload.access_token;
    const auth = await slackApi<Record<string, unknown> & { ok: boolean }>(token, "auth.test");
    const team = (payload.team && typeof payload.team === "object" ? payload.team : {}) as Record<string, unknown>;
    const user = (payload.authed_user && typeof payload.authed_user === "object" ? payload.authed_user : {}) as Record<string, unknown>;
    const botUserId = String(payload.bot_user_id ?? user.id ?? auth.user_id ?? "");
    await saveSlackIntegration(String(stateRecord.workspace_id), {
      slack_team_id: String(team.id ?? auth.team_id ?? ""),
      slack_team_name: String(team.name ?? auth.team ?? "Slack workspace"),
      bot_user_id: botUserId,
      bot_token_ciphertext: encryptSlackToken(token),
      granted_scopes: typeof payload.scope === "string" ? payload.scope.split(",").filter(Boolean) : ["channels:read", "groups:read", "users:read", "team:read", "chat:write"],
      connection_status: "connected",
      connected_by: String(stateRecord.requested_by),
      connected_at: new Date().toISOString(),
      disconnected_at: null,
      last_error: null,
      notifications_enabled: true,
    });
    target.searchParams.set("slack", "connected");
  } catch (error) {
    target.searchParams.set("slackError", error instanceof Error ? error.message : "Slack authorization failed");
  }
  return NextResponse.redirect(target);
}
