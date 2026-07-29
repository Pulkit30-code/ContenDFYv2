"use client";

import { motion } from "framer-motion";
import { Bot, CheckCircle2, Sparkles, WandSparkles } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { rows } from "@/components/dashboard/dashboard-utils";
import { useTableList } from "@/hooks/use-table";

export function QualityControlContent({ email }: { email: string | null }) {
  const workspaces = useTableList("workspaces");
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="cfy-shell text-zinc-100 lg:flex"><DashboardSidebar email={email} /><div className="min-w-0 flex-1"><DashboardHeader workspaces={rows(workspaces.data)} /><main className="relative flex min-h-[calc(100svh-92px)] items-center justify-center px-5 pb-16 pt-10 sm:px-8 lg:px-12"><motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-[900px] overflow-hidden rounded-[24px] border border-violet-300/30 bg-[linear-gradient(130deg,rgba(44,39,91,.55),rgba(17,18,32,.78)_55%,rgba(34,28,75,.4))] px-7 py-16 text-center shadow-[0_28px_80px_rgba(0,0,0,.3),inset_0_1px_rgba(255,255,255,.06)] sm:px-16 sm:py-20"><span className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-violet-500/15 blur-3xl" /><span className="pointer-events-none absolute -bottom-36 -left-28 size-72 rounded-full bg-indigo-500/10 blur-3xl" /><div className="relative"><span className="mx-auto flex size-20 items-center justify-center rounded-[22px] border border-violet-300/35 bg-violet-400/[.13] text-4xl shadow-[0_0_30px_rgba(139,124,255,.18)]">🚧</span><span className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full border border-violet-300/35 bg-violet-400/[.15] px-3 py-1 text-[11px] font-semibold uppercase tracking-[.13em] text-violet-200"><Sparkles className="size-3" />Coming soon</span><h1 className="mt-6 text-3xl font-semibold tracking-[-.055em] text-white sm:text-[42px]">AI Quality Control</h1><p className="mx-auto mt-4 max-w-[680px] text-base leading-8 text-zinc-300 sm:text-lg">We&apos;re building an advanced AI-powered quality control system to automatically review captions, grammar, spelling, punctuation, subtitle timing, readability, and provide intelligent improvement suggestions.</p><div className="mx-auto mt-8 grid max-w-[630px] gap-3 text-left sm:grid-cols-3"><Signal icon={Bot} label="AI review" detail="Content-aware checks" /><Signal icon={WandSparkles} label="Suggestions" detail="Clear next steps" /><Signal icon={CheckCircle2} label="Quality score" detail="Delivery ready" /></div><button disabled className="mt-9 inline-flex h-12 items-center gap-2 rounded-xl border border-white/[.2] bg-slate-400/45 px-6 text-sm font-semibold text-white/90 shadow-[inset_0_1px_rgba(255,255,255,.2)]">Launching soon</button></div></motion.section></main></div></motion.div>;
}

function Signal({ icon: Icon, label, detail }: { icon: typeof Bot; label: string; detail: string }) {
  return <div className="rounded-[16px] border border-white/[.08] bg-black/15 p-3.5"><Icon className="size-4 text-violet-200" /><p className="mt-2 text-sm font-semibold text-zinc-100">{label}</p><p className="mt-1 text-xs text-zinc-400">{detail}</p></div>;
}
