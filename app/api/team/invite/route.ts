import { NextResponse } from "next/server";
import { z } from "zod";
import { isSessionExpiredError, requireAuthenticatedServerContext } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/supabase/server";

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Enter the teammate’s name."),
  email: z.email("Enter a valid email.").transform((value) => value.trim().toLowerCase()),
  // Workspace ownership is never transferable through an email invitation.
  role: z.enum(["project_manager", "editor", "client"]),
});

export async function POST(request: Request) {
  try {
    const payload = inviteSchema.safeParse(await request.json().catch(() => null));
    if (!payload.success) return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Check the invitation details." }, { status: 400 });

    let auth: Awaited<ReturnType<typeof requireAuthenticatedServerContext>>;
    try { auth = await requireAuthenticatedServerContext("POST /api/team/invite"); } catch (error) {
      if (isSessionExpiredError(error)) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
      throw error;
    }
    const { data: membership, error: membershipError } = await auth.supabase.from("workspace_memberships").select("workspace_id,role,is_active").eq("user_id", auth.user.id).eq("is_active", true).limit(1).maybeSingle();
    const workspaceId = membership?.workspace_id ? String(membership.workspace_id) : "";
    if (membershipError || !hasPermission(typeof membership?.role === "string" ? membership.role : null, "manage_team")) return NextResponse.json({ error: "You don’t have permission to invite teammates." }, { status: 403 });
    if (!workspaceId) return NextResponse.json({ error: "Select a workspace before inviting a teammate." }, { status: 409 });

    const { data: acceptedInvitation } = await auth.supabase
      .from("workspace_invitations")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", payload.data.email)
      .not("accepted_at", "is", null)
      .limit(1)
      .maybeSingle();
    if (acceptedInvitation) return NextResponse.json({ error: "This account has already been activated." }, { status: 409 });

    const { data: priorPending } = await auth.supabase
      .from("workspace_invitations")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", payload.data.email)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Store the role before creating the Auth user. The auth.users trigger
    // consumes this trusted invitation record and provisions the membership at
    // account creation time, so an invitee can never receive a fallback owner
    // workspace or an unselected role.
    await auth.supabase.from("workspace_invitations").update({ revoked_at: new Date().toISOString() }).eq("workspace_id", workspaceId).eq("email", payload.data.email).is("accepted_at", null).is("revoked_at", null);
    const { data: workspaceInvitation, error: workspaceInvitationError } = await auth.supabase.from("workspace_invitations").insert({ workspace_id: workspaceId, email: payload.data.email, role: payload.data.role, invited_by: auth.user.id }).select("id").single();
    if (workspaceInvitationError || !workspaceInvitation?.id) return NextResponse.json({ error: workspaceInvitationError?.message ?? "Couldn’t save the workspace invitation." }, { status: 500 });

    const admin = createAdminClient();
    // In local development return to the app instance handling this request,
    // not a stale configured public URL such as localhost:4173.
    const redirectOrigin = process.env.NODE_ENV === "production" ? getAppUrl() : "http://localhost:3000";
    const redirectTo = new URL("/auth/callback", redirectOrigin);
    // An invitation confirms the user but does not create a password. Always
    // take first-time invitees to the authenticated password-setup screen.
    redirectTo.searchParams.set("next", "/auth/create-password");
    const { data: invitation, error: invitationError } = await admin.auth.admin.inviteUserByEmail(payload.data.email, {
      redirectTo: redirectTo.toString(),
      data: { full_name: payload.data.name },
    });
    if (invitationError || !invitation.user?.id) {
      // An account created by an earlier invitation has no password until the
      // person sets one. Resend the correct setup flow instead of surfacing a
      // duplicate-account error or leaving them at the login screen.
      if (invitationError?.message.toLowerCase().includes("already") && invitationError.message.toLowerCase().includes("registered") && priorPending) {
        const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingUser = users.users.find((user) => user.email?.toLowerCase() === payload.data.email);
        const canResumeActivation = existingUser?.app_metadata.invitation_activation_pending !== false
          && existingUser?.app_metadata.invitation_activation_completed !== true;
        if (!existingUser || !canResumeActivation) {
          await auth.supabase.from("workspace_invitations").delete().eq("id", workspaceInvitation.id);
          return NextResponse.json({ error: "This email already belongs to an activated account." }, { status: 409 });
        }
        const { error: recoveryError } = await auth.supabase.auth.resetPasswordForEmail(payload.data.email, { redirectTo: redirectTo.toString() });
        if (!recoveryError) {
          await admin.auth.admin.updateUserById(existingUser.id, {
            app_metadata: {
              ...existingUser.app_metadata,
              invitation_activation_pending: true,
              invitation_activation_completed: false,
              workspace_invitation_id: workspaceInvitation.id,
            },
          });
          return NextResponse.json({ ok: true, email: payload.data.email, role: payload.data.role, setup: "password" });
        }
      }
      await auth.supabase.from("workspace_invitations").delete().eq("id", workspaceInvitation.id);
      return NextResponse.json({ error: invitationError?.message ?? "Couldn’t create an invitation." }, { status: 400 });
    }

    await admin.auth.admin.updateUserById(invitation.user.id, {
      app_metadata: {
        ...invitation.user.app_metadata,
        invitation_activation_pending: true,
        invitation_activation_completed: false,
        workspace_invitation_id: workspaceInvitation.id,
      },
    });

    return NextResponse.json({ ok: true, email: payload.data.email, role: payload.data.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn’t send invitation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
