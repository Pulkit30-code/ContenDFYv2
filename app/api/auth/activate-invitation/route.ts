import { NextResponse } from "next/server";
import { z } from "zod";
import { getInvitationActivationState } from "@/lib/invitation-activation";
import { isSessionExpiredError, requireAuthenticatedServerContext } from "@/lib/auth";
import { createAdminClient } from "@/supabase/server";

const passwordSchema = z.object({
  password: z.string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[a-z]/, "Include at least one lowercase letter.")
    .regex(/\d/, "Include at least one number.")
    .regex(/[^A-Za-z0-9]/, "Include at least one special character."),
  confirmation: z.string(),
}).refine((data) => data.password === data.confirmation, { path: ["confirmation"], message: "Passwords do not match." });

export async function POST(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin || origin !== requestOrigin || (fetchSite && fetchSite !== "same-origin")) {
    return NextResponse.json({ error: "This activation request could not be verified." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Send activation details as JSON." }, { status: 415 });
  }

  const parsed = passwordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your password." }, { status: 400 });

  try {
    const auth = await requireAuthenticatedServerContext("POST /api/auth/activate-invitation");
    const invitation = await getInvitationActivationState(auth.user);
    if (invitation.kind === "expired") return NextResponse.json({ error: "This invitation has expired. Ask your administrator for a new invitation." }, { status: 410 });
    if (invitation.kind === "activated") return NextResponse.json({ error: "This account has already been activated." }, { status: 409 });
    if (invitation.kind !== "pending") return NextResponse.json({ error: "This invitation is invalid or unavailable." }, { status: 400 });

    const admin = createAdminClient();
    const { data: current, error: currentError } = await admin.auth.admin.getUserById(auth.user.id);
    if (currentError || !current.user) return NextResponse.json({ error: "The invited account could not be verified." }, { status: 401 });

    const { error: passwordError } = await admin.auth.admin.updateUserById(auth.user.id, { password: parsed.data.password });
    if (passwordError) return NextResponse.json({ error: "We couldn’t save your password. Please try again." }, { status: 400 });

    const { error: activationError } = await admin.rpc("activate_workspace_invitation", {
      invitation_id: invitation.invitationId,
      activating_user: auth.user.id,
    });
    if (activationError) return NextResponse.json({ error: activationError.message }, { status: 409 });

    await admin.auth.admin.updateUserById(auth.user.id, {
      app_metadata: {
        ...current.user.app_metadata,
        invitation_activation_pending: false,
        invitation_activation_completed: true,
        invitation_activated_at: new Date().toISOString(),
      },
    });
    await auth.supabase.auth.signOut({ scope: "local" });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isSessionExpiredError(error)) return NextResponse.json({ error: "This invitation link is invalid or has expired." }, { status: 401 });
    return NextResponse.json({ error: "We couldn’t activate your account. Please try again." }, { status: 500 });
  }
}
