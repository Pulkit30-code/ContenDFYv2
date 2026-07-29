import { NextResponse } from "next/server";
import { getCurrentUser, isSessionExpiredError } from "@/lib/auth";
import { findSlackIntegration, getWorkspaceForUser, listSlackChannels, slackErrorMessage } from "@/lib/slack/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser("GET /api/slack/channels"); if (!user) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    const workspace = await getWorkspaceForUser(user.id, new URL(request.url).searchParams.get("workspaceId") ?? undefined);
    const integration = await findSlackIntegration(workspace.workspaceId);
    if (!integration || integration.connection_status !== "connected") return NextResponse.json({ error: "Connect Slack before loading channels." }, { status: 409 });
    return NextResponse.json({ channels: await listSlackChannels(integration) });
  } catch (error) {
    console.error("[Slack] Channel list failed", error);
    return NextResponse.json({ error: slackErrorMessage(error) }, { status: isSessionExpiredError(error) ? 401 : 500 });
  }
}
