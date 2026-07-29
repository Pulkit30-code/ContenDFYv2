import { NextResponse } from "next/server";
import { getCurrentUser, isSessionExpiredError } from "@/lib/auth";
import { findSlackIntegration, getSlackSnapshot, getWorkspaceForUser, slackErrorMessage } from "@/lib/slack/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser("GET /api/slack/status");
    if (!user) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    const workspaceId = new URL(request.url).searchParams.get("workspaceId") ?? undefined;
    const workspace = await getWorkspaceForUser(user.id, workspaceId);
    const integration = await findSlackIntegration(workspace.workspaceId);
    if (!integration || integration.connection_status !== "connected") return NextResponse.json({ connected: false, integration: integration ? { connectionStatus: integration.connection_status, lastError: integration.last_error } : null });
    try {
      const snapshot = await getSlackSnapshot(integration);
      return NextResponse.json({ connected: true, snapshot, integration: { id: integration.id, workspaceId: integration.workspace_id, defaultChannelId: integration.channel_id ?? "", defaultChannelName: integration.channel_name ?? "", connectedBy: String(integration.connected_by) === user.id ? (workspace.profile.full_name ?? workspace.profile.email ?? "Current user") : String(integration.connected_by ?? "Workspace member"), connectedAt: integration.connected_at ?? "", lastSync: integration.updated_at ?? integration.last_tested_at ?? "", lastTestedAt: integration.last_tested_at ?? "", grantedScopes: integration.granted_scopes ?? [], connectionStatus: integration.connection_status } });
    } catch (error) {
      console.error("[Slack] Status check failed", { workspaceId: workspace.workspaceId, error });
      return NextResponse.json({ connected: false, integration: { id: integration.id, connectionStatus: "error", lastError: slackErrorMessage(error) }, error: slackErrorMessage(error) });
    }
  } catch (error) {
    return NextResponse.json({ error: isSessionExpiredError(error) ? "Your session has expired. Please sign in again." : error instanceof Error ? error.message : "Unable to load Slack status" }, { status: isSessionExpiredError(error) ? 401 : 500 });
  }
}
