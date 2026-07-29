import { NextResponse } from "next/server";
import { getCurrentUser, isSessionExpiredError } from "@/lib/auth";
import { findSlackIntegration, getWorkspaceForUser, slackApi, decryptSlackToken, slackErrorMessage } from "@/lib/slack/service";
import { buildSlackBlocks, recordSlackAudit } from "@/lib/slack/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let integrationId = ""; let workspaceId = ""; let channelId = "";
  try {
    const user = await getCurrentUser("POST /api/slack/test"); if (!user) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    const body = await request.json().catch(() => ({})) as { workspaceId?: string };
    const workspace = await getWorkspaceForUser(user.id, body.workspaceId); workspaceId = workspace.workspaceId;
    const integration = await findSlackIntegration(workspaceId);
    if (!integration || integration.connection_status !== "connected" || !integration.channel_id) return NextResponse.json({ error: "Connect Slack and choose a default channel first." }, { status: 409 });
    integrationId = String(integration.id); channelId = String(integration.channel_id);
    const timestamp = new Date().toISOString();
    const currentUser = String(workspace.profile.full_name ?? workspace.profile.email ?? "ContenDFY user");
    const blocks = buildSlackBlocks({ type: "system_alert", title: "Slack connection test", status: "Connected", details: "✅ ContenDFY is successfully connected to Slack.", actor: currentUser, timestamp });
    const result = await slackApi<Record<string, unknown> & { ok: boolean; ts?: string }>(decryptSlackToken(String(integration.bot_token_ciphertext)), "chat.postMessage", { channel: channelId, text: "✅ ContenDFY is successfully connected to Slack.", blocks });
    await recordSlackAudit({ workspace_id: workspaceId, integration_id: integrationId, event_type: "connection_test", entity_type: "integration", entity_id: integrationId, channel_id: channelId, delivery_status: "test", slack_message_ts: result.ts ?? null, request_summary: { channelName: integration.channel_name ?? "", workspaceName: integration.slack_team_name ?? "" }, delivered_at: timestamp });
    // Keep the UI's last sync/tested indicator accurate without exposing the token.
    const { createAdminClient } = await import("@/supabase/server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = createAdminClient() as any;
    await client.from("slack_integrations").update({ last_tested_at: timestamp, last_error: null, updated_at: timestamp }).eq("id", integrationId);
    return NextResponse.json({ ok: true, timestamp });
  } catch (error) {
    if (integrationId) await recordSlackAudit({ workspace_id: workspaceId, integration_id: integrationId, event_type: "connection_test", entity_type: "integration", entity_id: integrationId, channel_id: channelId || null, delivery_status: "failed", error_message: slackErrorMessage(error), delivered_at: new Date().toISOString() });
    return NextResponse.json({ error: slackErrorMessage(error) }, { status: isSessionExpiredError(error) ? 401 : 500 });
  }
}
