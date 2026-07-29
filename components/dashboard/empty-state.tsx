import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <div className="flex min-h-44 flex-col items-center justify-center px-5 text-center"><div className="flex size-11 items-center justify-center rounded-2xl border border-white/[.08] bg-gradient-to-br from-violet-400/15 to-white/[.03] text-violet-200 shadow-[0_0_30px_rgba(139,124,255,.12)]"><Icon className="size-4" /></div><p className="mt-4 text-sm font-medium text-zinc-200">{title}</p><p className="mt-1 max-w-56 text-xs leading-5 text-zinc-500">{description}</p></div>;
}

export function WidgetError() {
  return <div className="flex min-h-44 items-center justify-center px-5 text-center text-sm text-rose-300">This data is unavailable right now.</div>;
}
