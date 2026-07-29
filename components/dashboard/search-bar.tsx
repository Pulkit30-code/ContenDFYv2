"use client";

import { Command, Search } from "lucide-react";
import { useGlobalCommandCenter } from "@/components/shared/global-command-center";

export function SearchBar() {
  const commandCenter = useGlobalCommandCenter();
  return <button type="button" onClick={() => commandCenter?.open()} className="cfy-control hidden h-11 w-full max-w-md items-center gap-2.5 px-3.5 text-left text-sm transition hover:border-white/[.18] md:flex"><span className="flex size-6 items-center justify-center rounded-lg bg-violet-400/10 text-violet-200"><Search className="size-3.5" /></span><span className="min-w-0 flex-1 text-zinc-600">Ask or search anything</span><kbd className="cfy-command flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-[10px]"><Command className="size-2.5" />K</kbd></button>;
}
