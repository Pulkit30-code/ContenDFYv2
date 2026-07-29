import { createAdminClient } from "@/supabase/server";

export type InvitationActivationState =
  | { kind: "pending"; invitationId: string; email: string }
  | { kind: "expired" | "invalid" | "activated"; email: string | null };

export async function getInvitationActivationState(user: { id: string; email: string | null }): Promise<InvitationActivationState> {
  if (!user.email) return { kind: "invalid", email: null };

  const admin = createAdminClient();
  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(user.id);
  if (authError || !authUser.user || authUser.user.email?.toLowerCase() !== user.email.toLowerCase()) {
    return { kind: "invalid", email: user.email };
  }

  const { data, error } = await admin
    .from("workspace_invitations")
    .select("id,email,expires_at,accepted_at,activated_at,revoked_at,status")
    .eq("email", user.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return { kind: "invalid", email: user.email };
  const activationPending = authUser.user.app_metadata.invitation_activation_pending === true;
  if (data.activated_at || authUser.user.app_metadata.invitation_activation_completed === true || ((data.accepted_at || data.status === "accepted") && !activationPending)) {
    return { kind: "activated", email: user.email };
  }
  if (data.revoked_at || data.status === "revoked") return { kind: "invalid", email: user.email };
  if (data.status === "expired" || !data.expires_at || new Date(String(data.expires_at)).getTime() <= Date.now()) {
    return { kind: "expired", email: user.email };
  }
  return { kind: "pending", invitationId: String(data.id), email: user.email };
}
