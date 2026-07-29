import type { Metadata } from "next";
import { CreatePasswordForm } from "@/components/auth/create-password-form";
import { getInvitationActivationState } from "@/lib/invitation-activation";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create password · ContenDFY" };
export const dynamic = "force-dynamic";

export default async function CreatePasswordPage() {
  const user = await getCurrentUser("GET /auth/create-password");
  const state = user ? await getInvitationActivationState(user) : { kind: "invalid" as const, email: null };
  return <CreatePasswordForm state={state} />;
}
