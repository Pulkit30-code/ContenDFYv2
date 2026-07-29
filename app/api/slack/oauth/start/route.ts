import { NextResponse } from "next/server";
import { getCurrentUser, isSessionExpiredError } from "@/lib/auth";
import { createOAuthState, getWorkspaceForUser } from "@/lib/slack/service";
import { getSlackEnv, getSlackRedirectUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser("GET /api/slack/oauth/start");
    if (!user) return NextResponse.redirect(new URL("/login?next=/workspace/settings&reason=session-expired", request.url));
    const workspaceId = new URL(request.url).searchParams.get("workspaceId") ?? undefined;
    const workspace = await getWorkspaceForUser(user.id, workspaceId);
    const state = await createOAuthState(workspace);
    const env = getSlackEnv();
    const url = new URL("https://slack.com/oauth/v2/authorize");
    url.searchParams.set("client_id", env.SLACK_CLIENT_ID);
    url.searchParams.set("scope", "channels:read,groups:read,users:read,team:read,chat:write");
    url.searchParams.set("redirect_uri", getSlackRedirectUrl());
    url.searchParams.set("state", state);
    return NextResponse.redirect(url);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[Slack] OAuth start failed", { error });
    const message = isSessionExpiredError(error) ? "Your session has expired. Please sign in again." : error instanceof Error ? error.message : "Unable to start Slack authorization";
    return NextResponse.redirect(new URL(`/workspace/settings?slackError=${encodeURIComponent(message)}`, request.url));
  }
}
