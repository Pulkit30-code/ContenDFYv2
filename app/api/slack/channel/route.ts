import { NextResponse } from "next/server";
import { getCurrentUser, isSessionExpiredError } from "@/lib/auth";
import { findSlackIntegration, getWorkspaceForUser, saveSlackIntegration } from "@/lib/slack/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser("POST /api/slack/channel"); if (!user) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    const body = await request.json() as { workspaceId?: string; channelId?: string; channelName?: string };
    const workspace = await getWorkspaceForUser(user.id, body.workspaceId);
    const integration = await findSlackIntegration(workspace.workspaceId);
    if (!integration) return NextResponse.json({ error: "Connect Slack before selecting a channel." }, { status: 409 });
    const updated = await saveSlackIntegration(workspace.workspaceId, { channel_id: body.channelId ?? null, channel_name: body.channelName ?? null, updated_at: new Date().toISOString() });
    return NextResponse.json({ channelId: updated.channel_id ?? "", channelName: updated.channel_name ?? "" });
  } catch (error) { return NextResponse.json({ error: isSessionExpiredError(error) ? "Your session has expired. Please sign in again." : error instanceof Error ? error.message : "Unable to save Slack channel" }, { status: isSessionExpiredError(error) ? 401 : 500 }); }
}
