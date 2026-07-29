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
      // Supabase consumes its implicit invite fragment locally. Remove the
      // fragment immediately afterward so credentials never remain in history.
      await supabase.auth.getSession();
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
