"use client";

import { motion } from "framer-motion";
import { Check, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { InvitationActivationState } from "@/lib/invitation-activation";

const requirements = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
  { label: "One special character", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export function CreatePasswordForm({ state }: { state: InvitationActivationState }) {
  if (state.kind !== "pending") return <InvitationError kind={state.kind} email={state.email} />;
  return <ActivationForm email={state.email} />;
}

function ActivationForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checks = useMemo(() => requirements.map((rule) => rule.test(password)), [password]);
  const strength = checks.filter(Boolean).length;
  const valid = checks.every(Boolean) && password === confirmation && confirmation.length > 0;
  const mismatch = confirmation.length > 0 && password !== confirmation;

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => router.replace("/login?activated=true"), 2600);
    return () => window.clearTimeout(timer);
  }, [router, success]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!checks.every(Boolean)) return setError("Choose a password that meets every requirement.");
    if (password !== confirmation) return setError("The passwords do not match.");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/activate-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password, confirmation }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "We couldn’t activate your account.");
      setPassword("");
      setConfirmation("");
      setSuccess(true);
      toast.success("Your password has been created successfully.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "We couldn’t activate your account.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return <motion.div initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} className="text-center"><span className="mx-auto flex size-16 items-center justify-center rounded-[20px] border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 shadow-[0_16px_38px_rgba(16,185,129,.12)]"><CheckCircle2 className="size-7" /></span><p className="mt-7 text-xs font-medium uppercase tracking-[.16em] text-emerald-300">Account activated</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white">Password created</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">Your password has been created successfully. You can now sign in to Contendify.</p><Link href="/login?activated=true" className="auth-submit mt-7">Go to Login</Link><p className="mt-4 text-xs text-zinc-600">Redirecting automatically…</p></motion.div>;
  }

  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><div className="mb-8"><span className="flex size-11 items-center justify-center rounded-[14px] border border-indigo-300/15 bg-indigo-400/10 text-indigo-300 shadow-[0_12px_30px_rgba(99,102,241,.13)]"><KeyRound className="size-5" /></span><p className="mt-6 text-xs font-medium uppercase tracking-[.16em] text-indigo-300">ContenDFY Portal</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white">Create your password</h1><p className="mt-2 text-sm leading-6 text-zinc-400">Welcome to the team. Secure your account to finish activation.</p></div><form onSubmit={submit} noValidate className="space-y-4"><label className="auth-field"><span>Invited email</span><div className="relative"><Mail className="auth-icon" /><input value={email} readOnly aria-readonly="true" className="auth-input cursor-not-allowed pl-10 text-zinc-400" /></div></label><label className="auth-field"><span>New password</span><div className="relative"><LockKeyhole className="auth-icon" /><input autoFocus value={password} onChange={(event) => setPassword(event.target.value)} type={visible ? "text" : "password"} autoComplete="new-password" className="auth-input px-10" aria-describedby="password-requirements" required /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide passwords" : "Show passwords"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-500 transition hover:text-zinc-200">{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label><div aria-label={`Password strength: ${strengthLabel(strength)}`} className="space-y-2"><div className="flex gap-1.5">{requirements.map((rule, index) => <span key={rule.label} className={`h-1.5 flex-1 rounded-full transition-colors ${index < strength ? strengthColor(strength) : "bg-white/[.07]"}`} />)}</div><p className="text-right text-[10px] font-medium text-zinc-500">{strengthLabel(strength)}</p></div><div id="password-requirements" className="rounded-[16px] border border-white/[.08] bg-white/[.025] p-3.5"><p className="flex items-center gap-2 text-[11px] font-semibold text-zinc-300"><ShieldCheck className="size-3.5 text-indigo-300" />Password requirements</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{requirements.map((rule, index) => <li key={rule.label} className={`flex items-center gap-2 text-[11px] transition-colors ${checks[index] ? "text-emerald-300" : "text-zinc-500"}`}>{checks[index] ? <Check className="size-3.5" /> : <span className="size-3.5 rounded-full border border-zinc-700" />}{rule.label}</li>)}</ul></div><label className="auth-field"><span>Confirm password</span><div className="relative"><LockKeyhole className="auth-icon" /><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} type={visible ? "text" : "password"} autoComplete="new-password" className="auth-input px-10" aria-invalid={mismatch} required />{confirmation && <span className={`absolute inset-y-0 right-3 flex items-center ${mismatch ? "text-red-300" : "text-emerald-300"}`}>{mismatch ? <X className="size-4" /> : <Check className="size-4" />}</span>}</div>{mismatch && <small role="alert">Passwords do not match.</small>}</label>{error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">{error}</p>}<button type="submit" disabled={!valid || busy} className="auth-submit disabled:cursor-not-allowed disabled:opacity-50">{busy ? <><LoaderCircle className="size-4 animate-spin" />Creating password…</> : "Create Password"}</button></form><p className="mt-6 text-center text-xs leading-5 text-zinc-600">This secure invitation can only be activated once.</p></motion.div>;
}

function InvitationError({ kind, email }: { kind: "expired" | "invalid" | "activated"; email: string | null }) {
  const content = kind === "expired" ? ["Invitation expired", "This invitation is no longer active. Ask your workspace administrator to send a new one."] : kind === "activated" ? ["Account already activated", "This invitation has already been used. Sign in with the password you created."] : ["Invitation unavailable", "This invitation link is invalid, incomplete, or belongs to another account."];
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-[18px] border border-red-300/15 bg-red-400/[.08] text-red-300"><ShieldCheck className="size-6" /></span><p className="mt-6 text-xs font-medium uppercase tracking-[.16em] text-indigo-300">ContenDFY Portal</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white">{content[0]}</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">{content[1]}</p>{email && <p className="mt-3 break-all text-xs text-zinc-600">{email}</p>}<Link href="/login" className="auth-submit mt-7">Go to Login</Link></motion.div>;
}

function strengthLabel(strength: number) { return strength <= 1 ? "Very weak" : strength === 2 ? "Weak" : strength === 3 ? "Fair" : strength === 4 ? "Strong" : "Very strong"; }
function strengthColor(strength: number) { return strength <= 2 ? "bg-red-400" : strength === 3 ? "bg-amber-400" : strength === 4 ? "bg-indigo-400" : "bg-emerald-400"; }
