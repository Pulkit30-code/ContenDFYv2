"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CreatePasswordForm } from "@/components/auth/create-password-form";
import type { InvitationActivationState } from "@/lib/invitation-activation";
import { createClient } from "@/supabase/client";

type InvitationErrorKind = Exclude<
  InvitationActivationState["kind"],
  "pending"
>;

export function CreatePasswordGate() {
  const [state, setState] = useState<InvitationActivationState | null>(null);

  useEffect(() => {
    let active = true;

    const validateInvitation = async () => {
      try {
        const supabase = createClient();
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = fragment.get("access_token");
        const refreshToken = fragment.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            if (active) setState({ kind: "invalid", email: null });
            return;
          }
        } else {
          const { data } = await supabase.auth.getSession();

          if (!data.session) {
            if (active) setState({ kind: "invalid", email: null });
            return;
          }
        }

        // Remove credentials from browser history as soon as Supabase consumes
        // them. The established session is used for server-side validation.
        if (window.location.hash) {
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}${window.location.search}`,
          );
        }

        const response = await fetch("/api/auth/activate-invitation", {
          method: "GET",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const result: unknown = await response.json().catch(() => null);

        if (active) {
          setState(
            isInvitationActivationState(result)
              ? result
              : { kind: "invalid", email: null },
          );
        }
      } catch {
        if (active) setState({ kind: "invalid", email: null });
      }
    };

    void validateInvitation();

    return () => {
      active = false;
    };
  }, []);

  if (!state) return <InvitationSkeleton />;

  if (state.kind !== "pending") {
    return <InvitationError kind={state.kind} email={state.email} />;
  }

  return <CreatePasswordForm invitedEmail={state.email} />;
}

function isInvitationActivationState(
  value: unknown,
): value is InvitationActivationState {
  if (!value || typeof value !== "object" || !("kind" in value)) return false;

  const kind = value.kind;
  return (
    kind === "pending" ||
    kind === "expired" ||
    kind === "invalid" ||
    kind === "activated"
  );
}

function InvitationError({
  kind,
  email,
}: Readonly<{ kind: InvitationErrorKind; email: string | null }>) {
  const content = {
    expired: {
      icon: Clock3,
      eyebrow: "Invitation expired",
      title: "This invitation has expired",
      description:
        "For your security, invitation links are only active for a limited time. Ask your workspace administrator to send a new one.",
      tone: "border-amber-300/20 bg-amber-400/10 text-amber-300",
    },
    invalid: {
      icon: ShieldAlert,
      eyebrow: "Invalid invitation",
      title: "This invitation isn’t valid",
      description:
        "The link may be incomplete, invalid, or already replaced. Check that you opened the complete link from your invitation email.",
      tone: "border-red-300/20 bg-red-400/10 text-red-300",
    },
    activated: {
      icon: CheckCircle2,
      eyebrow: "Invitation already used",
      title: "Your account is already active",
      description:
        "This invitation has already been completed. Sign in with the password associated with your account.",
      tone: "border-indigo-300/20 bg-indigo-400/10 text-indigo-300",
    },
  } satisfies Record<
    InvitationErrorKind,
    {
      icon: typeof AlertTriangle;
      eyebrow: string;
      title: string;
      description: string;
      tone: string;
    }
  >;
  const selected = content[kind];
  const Icon = selected.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-3 text-center"
    >
      <span
        className={`mx-auto flex size-16 items-center justify-center rounded-[20px] border ${selected.tone}`}
      >
        <Icon className="size-7" />
      </span>
      <p className="mt-7 text-xs font-medium uppercase tracking-[.16em] text-zinc-500">
        {selected.eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white">
        {selected.title}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">
        {selected.description}
      </p>
      {email && (
        <p className="mt-4 break-all text-xs text-zinc-600">{email}</p>
      )}
      <Link href="/login" className="auth-submit mt-7">
        Go to sign in
      </Link>
    </motion.div>
  );
}

function InvitationSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-label="Validating invitation"
      aria-busy="true"
    >
      <div className="cfy-skeleton h-4 w-32" />
      <div className="space-y-3">
        <div className="cfy-skeleton h-9 w-72 max-w-full" />
        <div className="cfy-skeleton h-4 w-full" />
      </div>
      <div className="space-y-4">
        <div className="cfy-skeleton h-11 w-full" />
        <div className="cfy-skeleton h-11 w-full" />
        <div className="cfy-skeleton h-28 w-full" />
        <div className="cfy-skeleton h-11 w-full" />
      </div>
    </div>
  );
}
