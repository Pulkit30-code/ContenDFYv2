"use client";

import { useEffect, useState } from "react";
import { CreatePasswordForm } from "@/components/auth/create-password-form";
import type { InvitationActivationState } from "@/lib/invitation-activation";
import { createClient } from "@/supabase/client";

export function CreatePasswordGate() {
  const [state, setState] = useState<InvitationActivationState | null>(null);

  useEffect(() => {
    let active = true;
    const validate = async () => {
      const supabase = createClient();
      // Admin invite links use an implicit fragment rather than a PKCE code.
      // Consume it only in memory, then remove it before any application call.
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      } else {
        await supabase.auth.getSession();
      }
      if (window.location.hash) window.history.replaceState({}, "", "/auth/create-password");

      const response = await fetch("/api/auth/activate-invitation", {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({ kind: "invalid", email: null })) as InvitationActivationState;
      if (active) setState(response.ok ? result : { kind: "invalid", email: result.email ?? null });
    };
    void validate();
    return () => { active = false; };
  }, []);

  if (!state) return <ActivationSkeleton />;
  return <CreatePasswordForm state={state} />;
}

function ActivationSkeleton() {
  return <div className="space-y-6" aria-label="Validating invitation" aria-busy="true"><div className="cfy-skeleton h-11 w-11" /><div className="space-y-3"><div className="cfy-skeleton h-4 w-28" /><div className="cfy-skeleton h-9 w-64 max-w-full" /><div className="cfy-skeleton h-4 w-full" /></div><div className="space-y-4"><div className="cfy-skeleton h-12 w-full" /><div className="cfy-skeleton h-12 w-full" /><div className="cfy-skeleton h-28 w-full" /><div className="cfy-skeleton h-12 w-full" /></div></div>;
}
