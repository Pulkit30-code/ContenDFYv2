import type { Metadata } from "next";
import { CreatePasswordGate } from "@/components/auth/create-password-gate";

export const metadata: Metadata = {
  title: "Create password · ContenDFY",
  description: "Create a password for your ContenDFY workspace invitation.",
};

export default function CreatePasswordPage() {
  return <CreatePasswordGate />;
}
