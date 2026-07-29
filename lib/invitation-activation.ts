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
  if (data.accepted_at || data.activated_at || data.status === "accepted" || authUser.user.app_metadata.invitation_activation_completed === true) {
    return { kind: "activated", email: user.email };
  }
  if (data.revoked_at || data.status === "revoked") return { kind: "invalid", email: user.email };
  if (data.status === "expired" || !data.expires_at || new Date(String(data.expires_at)).getTime() <= Date.now()) {
    return { kind: "expired", email: user.email };
  }
  return { kind: "pending", invitationId: String(data.id), email: user.email };
}
