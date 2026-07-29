import type { Metadata } from "next";
import { CreatePasswordGate } from "@/components/auth/create-password-gate";

export const metadata: Metadata = { title: "Create password · ContenDFY" };
export default async function CreatePasswordPage() {
  return <CreatePasswordGate />;
}
