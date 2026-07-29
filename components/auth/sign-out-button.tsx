"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/supabase/client";
export function SignOutButton() { const router = useRouter(); const [busy, setBusy] = useState(false); return <button className="mt-8 inline-flex h-10 items-center gap-2 rounded-xl border border-white/[.12] px-4 text-sm font-medium text-zinc-200 transition hover:bg-white/[.07] disabled:opacity-50" disabled={busy} onClick={async () => { setBusy(true); const { error } = await createClient().auth.signOut(); if (error) { toast.error(error.message); setBusy(false); return; } toast.success("You’ve been signed out."); router.replace("/login"); router.refresh(); }}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}Sign out</button>; }
