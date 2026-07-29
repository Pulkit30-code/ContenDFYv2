import "server-only";

import { decryptSlackToken, findSlackIntegration, slackApi, type SlackIntegrationRecord } from "@/lib/slack/service";
import { createAdminClient } from "@/supabase/server";

export const slackNotificationTypes = ["new_project", "assignment_created", "assignment_updated", "deadline_today", "deadline_missed", "client_approval", "revision_requested", "revision_approved", "quality_control_failed", "quality_control_passed", "editor_assigned", "editor_completed_task", "new_client", "team_invitation", "system_alert"] as const;
export type SlackNotificationType = (typeof slackNotificationTypes)[number];
export type SlackNotificationPayload = { type: SlackNotificationType; title?: string; status?: string; project?: string; client?: string; assignedEditor?: string; details?: string; actionUrl?: string; actionLabel?: string; actor?: string; timestamp?: string };
type SlackBlock = Record<string, unknown>;

function text(value: string) { return { type: "mrkdwn", text: value }; }
function label(type: SlackNotificationType) { return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export function buildSlackBlocks(payload: SlackNotificationPayload): SlackBlock[] {
  const timestamp = payload.timestamp ?? new Date().toISOString();
  const facts = [["Project", payload.project], ["Client", payload.client], ["Assigned Editor", payload.assignedEditor], ["By", payload.actor]].filter(([, value]) => value);
  const blocks: SlackBlock[] = [
    { type: "header", text: { type: "plain_text", text: `ContenDFY · ${payload.title ?? label(payload.type)}`, emoji: true } },
    { type: "section", text: text(`${payload.status ? `*${payload.status}*  ` : ""}${payload.details ?? label(payload.type)}`) },
  ];
  if (facts.length) blocks.push({ type: "section", fields: facts.map(([key, value]) => text(`*${key}*\n${value}`)) });
  if (payload.actionUrl) blocks.push({ type: "actions", elements: [{ type: "button", text: { type: "plain_text", text: payload.actionLabel ?? "Open in ContenDFY", emoji: true }, url: payload.actionUrl, action_id: `contendfy_${payload.type}` }] });
  blocks.push({ type: "context", elements: [text(`ContenDFY  •  <!date^${Math.floor(Date.parse(timestamp) / 1000)}^{date_short_pretty} at {time}|${timestamp}>`)] });
  return blocks;
}

export async function postSlackNotification(workspaceId: string, payload: SlackNotificationPayload, integration?: SlackIntegrationRecord) {
  const connection = integration ?? await findSlackIntegration(workspaceId);
  if (!connection || connection.connection_status !== "connected" || !connection.channel_id) throw new Error("Slack is connected but no default notification channel is selected.");
  const token = decryptSlackToken(String(connection.bot_token_ciphertext));
  const result = await slackApi<Record<string, unknown> & { ok: boolean; ts?: string }>(token, "chat.postMessage", { channel: connection.channel_id, text: payload.title ?? label(payload.type), blocks: buildSlackBlocks(payload) });
  await recordSlackAudit({ workspace_id: workspaceId, integration_id: connection.id, event_type: payload.type, entity_type: "notification", channel_id: connection.channel_id, delivery_status: "delivered", slack_message_ts: result.ts ?? null, request_summary: { title: payload.title ?? label(payload.type) }, delivered_at: new Date().toISOString() });
  return result.ts ?? null;
}

export async function queueSlackNotification(workspaceId: string, payload: SlackNotificationPayload, entity?: { type?: string; id?: string; actorUserId?: string }) {
  // Queue records are intentionally generic because the existing worker owns delivery/retry policy.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = createAdminClient() as any;
  const { error } = await client.from("slack_notification_queue").insert({ workspace_id: workspaceId, event_type: payload.type, entity_type: entity?.type ?? "notification", entity_id: entity?.id ?? null, actor_user_id: entity?.actorUserId ?? null, payload, idempotency_key: `${workspaceId}:${payload.type}:${entity?.id ?? crypto.randomUUID()}`, status: "pending", attempts: 0, max_attempts: 6, available_at: new Date().toISOString() });
  if (error) throw new Error(`Unable to queue Slack notification: ${error.message}`);
}

async function recordSlackAudit(input: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = createAdminClient() as any;
  const { error } = await client.from("slack_delivery_audit_logs").insert({ attempt: 1, ...input });
  if (error) console.error("[Slack] Audit log failed", error);
}

export { recordSlackAudit };
