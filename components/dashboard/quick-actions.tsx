"use client";

import { CheckSquare2, FilePlus2, FolderPlus, UserPlus } from "lucide-react";
import { toast } from "sonner";

const actions = [{ label: "Assign project", icon: FolderPlus }, { label: "Manage team", icon: UserPlus }, { label: "Workspace settings", icon: CheckSquare2 }, { label: "Search all", icon: FilePlus2 }];
export function QuickActions() { return <section className="cfy-card"><div className="cfy-card-head"><h2 className="text-sm font-semibold tracking-[-.015em] text-zinc-100">Quick actions</h2><p className="mt-1 text-xs text-zinc-500">Owner workflows</p></div><div className="grid grid-cols-2 gap-3 p-5">{actions.map(({ label, icon: Icon }) => <button key={label} onClick={() => toast.info(`${label} will be available when its module is introduced.`)} className="group flex min-h-17 items-center gap-3 rounded-[14px] border border-white/[.12] bg-white/[.035] px-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/[.25] hover:bg-violet-400/[.06]"><span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-violet-400/[.14] text-violet-200"><Icon className="size-4" /></span><span className="text-xs font-medium text-zinc-300 transition group-hover:text-white">{label}</span></button>)}</div></section>; }
