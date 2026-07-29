"use client";

import { motion } from "framer-motion";
import {
  Aperture,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

const requirements = [
  { label: "8 characters minimum", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
  {
    label: "One special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

export function CreatePasswordForm({
  invitedEmail,
}: Readonly<{ invitedEmail: string }>) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = useMemo(
    () => requirements.map((requirement) => requirement.test(password)),
    [password],
  );
  const strength = checks.filter(Boolean).length;
  const passwordsMatch =
    confirmation.length > 0 && password === confirmation;
  const valid = checks.every(Boolean) && passwordsMatch;
  const mismatch = confirmation.length > 0 && password !== confirmation;

  useEffect(() => {
    if (!success) return;

    const redirectTimer = window.setTimeout(() => {
      router.replace("/login?activated=true");
    }, 2500);

    return () => window.clearTimeout(redirectTimer);
  }, [router, success]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!checks.every(Boolean)) {
      setError("Choose a password that meets every requirement.");
      return;
    }

    if (!passwordsMatch) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/auth/activate-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password, confirmation }),
      });
      const result: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getActivationError(result) ??
            "We couldn’t create your password. Please try again.",
        );
      }

      setPassword("");
      setConfirmation("");
      setSuccess(true);
      toast.success("Password created successfully.");
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "We couldn’t create your password. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-4 text-center"
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-[20px] border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 shadow-[0_16px_38px_rgba(16,185,129,.12)]">
          <CheckCircle2 className="size-7" />
        </span>
        <p className="mt-7 text-xs font-medium uppercase tracking-[.16em] text-emerald-300">
          You&apos;re all set
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white">
          Password created successfully.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">
          Your invited account is active and ready to use.
        </p>
        <Link href="/login" className="auth-submit mt-7">
          Go to Login
        </Link>
        <p className="mt-4 text-xs text-zinc-600">
          Redirecting to login…
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white lg:hidden"
      >
        <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-200 to-indigo-400 text-zinc-950">
          <Aperture className="size-[18px]" />
        </span>
        ContenDFY
      </Link>

      <div className="mb-7">
        <p className="text-xs font-medium uppercase tracking-[.16em] text-indigo-300">
          Workspace invitation
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white sm:text-[2rem]">
          Welcome to ContenDFY
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Create a secure password to finish setting up your account.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        <label className="auth-field">
          <span>Invited email</span>
          <div className="relative">
            <Mail className="auth-icon" />
            <input
              value={invitedEmail}
              type="email"
              readOnly
              aria-readonly="true"
              className="auth-input cursor-not-allowed pl-10 text-zinc-400"
            />
          </div>
        </label>

        <label className="auth-field">
          <span>New password</span>
          <div className="relative">
            <LockKeyhole className="auth-icon" />
            <input
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={passwordVisible ? "text" : "password"}
              autoComplete="new-password"
              className="auth-input px-10"
              aria-describedby="password-strength password-requirements"
              required
            />
            <VisibilityButton
              visible={passwordVisible}
              onToggle={() => setPasswordVisible((current) => !current)}
              fieldName="new password"
            />
          </div>
        </label>

        <div
          id="password-strength"
          aria-live="polite"
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Password strength</span>
            <span className="text-[11px] font-medium text-zinc-300">
              {strengthLabel(strength)}
            </span>
          </div>
          <div className="flex gap-1.5">
            {requirements.map((requirement, index) => (
              <span
                key={requirement.label}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index < strength
                    ? strengthColor(strength)
                    : "bg-white/[.07]"
                }`}
              />
            ))}
          </div>
        </div>

        <div
          id="password-requirements"
          className="rounded-[16px] border border-white/[.08] bg-white/[.025] p-3.5"
        >
          <p className="flex items-center gap-2 text-[11px] font-semibold text-zinc-300">
            <ShieldCheck className="size-3.5 text-indigo-300" />
            Your password needs
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {requirements.map((requirement, index) => (
              <li
                key={requirement.label}
                className={`flex items-center gap-2 text-[11px] transition-colors ${
                  checks[index] ? "text-emerald-300" : "text-zinc-500"
                }`}
              >
                {checks[index] ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  <span className="size-3.5 rounded-full border border-zinc-700" />
                )}
                {requirement.label}
              </li>
            ))}
          </ul>
        </div>

        <label className="auth-field">
          <span>Confirm password</span>
          <div className="relative">
            <LockKeyhole className="auth-icon" />
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              type={confirmationVisible ? "text" : "password"}
              autoComplete="new-password"
              className="auth-input px-10"
              aria-invalid={mismatch}
              aria-describedby="password-match"
              required
            />
            <VisibilityButton
              visible={confirmationVisible}
              onToggle={() => setConfirmationVisible((current) => !current)}
              fieldName="confirmation password"
            />
          </div>
          <span
            id="password-match"
            aria-live="polite"
            className={`flex min-h-4 items-center gap-1.5 text-xs font-normal ${
              mismatch
                ? "text-red-300"
                : passwordsMatch
                  ? "text-emerald-300"
                  : "text-zinc-600"
            }`}
          >
            {mismatch ? (
              <X className="size-3.5" />
            ) : passwordsMatch ? (
              <Check className="size-3.5" />
            ) : null}
            {mismatch
              ? "Passwords do not match."
              : passwordsMatch
                ? "Passwords match."
                : "Re-enter your password."}
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!valid || busy}
          className="auth-submit disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Creating password…
            </>
          ) : (
            "Create Password"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs leading-5 text-zinc-600">
        Use a unique password you don&apos;t use for another account.
      </p>
    </motion.div>
  );
}

function VisibilityButton({
  visible,
  onToggle,
  fieldName,
}: Readonly<{
  visible: boolean;
  onToggle: () => void;
  fieldName: string;
}>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${visible ? "Hide" : "Show"} ${fieldName}`}
      aria-pressed={visible}
      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-500 transition hover:text-zinc-200"
    >
      {visible ? (
        <EyeOff className="size-4" />
      ) : (
        <Eye className="size-4" />
      )}
    </button>
  );
}

function strengthLabel(strength: number) {
  if (strength === 0) return "Not set";
  if (strength <= 2) return "Weak";
  if (strength === 3) return "Fair";
  if (strength === 4) return "Strong";
  return "Very strong";
}

function strengthColor(strength: number) {
  if (strength <= 2) return "bg-red-400";
  if (strength === 3) return "bg-amber-400";
  if (strength === 4) return "bg-indigo-400";
  return "bg-emerald-400";
}

function getActivationError(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return null;
}
