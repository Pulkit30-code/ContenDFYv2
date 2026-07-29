import { NextResponse } from "next/server";
import { getCurrentUser, isSessionExpiredError } from "@/lib/auth";
import { findSlackIntegration, getWorkspaceForUser, saveSlackIntegration } from "@/lib/slack/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser("POST /api/slack/disconnect"); if (!user) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    const body = await request.json().catch(() => ({})) as { workspaceId?: string };
    const workspace = await getWorkspaceForUser(user.id, body.workspaceId);
    if (await findSlackIntegration(workspace.workspaceId)) await saveSlackIntegration(workspace.workspaceId, { connection_status: "disconnected", disconnected_at: new Date().toISOString(), bot_token_ciphertext: null, last_error: null, updated_at: new Date().toISOString() });
    return NextResponse.json({ connected: false });
  } catch (error) { return NextResponse.json({ error: isSessionExpiredError(error) ? "Your session has expired. Please sign in again." : error instanceof Error ? error.message : "Unable to disconnect Slack" }, { status: isSessionExpiredError(error) ? 401 : 500 }); }
}
