import type { ReactNode } from "react";
import { Aperture, ShieldCheck, Sparkles } from "lucide-react";

export function AuthShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="cfy-auth-shell lg:grid-cols-[1.05fr_.95fr]">
      <div className="cfy-auth-orb left-[10%] top-[12%] size-72" />
      <div className="cfy-auth-orb bottom-[8%] right-[10%] size-64 opacity-60" />
      <section className="relative hidden border-r border-white/[.08] p-10 lg:flex lg:flex-col xl:p-14">
        <div className="flex items-center gap-3 text-sm font-semibold tracking-[-.02em] text-white"><span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-200 to-indigo-400 text-zinc-950 shadow-[0_0_24px_rgba(139,124,255,.38)]"><Aperture className="size-[18px]" /></span>ContenDFY <span className="rounded-md border border-white/[.1] bg-white/[.04] px-1.5 py-0.5 font-mono text-[9px] font-medium text-zinc-500">OS</span></div>
        <div className="my-auto max-w-lg">
          <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-violet-200/[.16] bg-violet-400/[.10] shadow-[0_0_36px_rgba(118,95,255,.2)]"><Sparkles className="size-5 text-violet-200" /></div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[.18em] text-violet-300">AI automation operating system</p>
          <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-.055em] text-white">Mission control for creative work.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-zinc-400">A precise, intelligent control plane for the teams and automation systems that move your agency forward.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500"><ShieldCheck className="size-4" />Secure, encrypted authentication</div>
      </section>
      <section className="relative flex min-h-svh items-center justify-center px-5 py-10 sm:px-8 lg:px-12"><div className="cfy-auth-panel w-full max-w-[440px]">{children}</div></section>
    </main>
  );
}
