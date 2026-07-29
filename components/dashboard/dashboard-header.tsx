"use client";
/* eslint-disable @next/next/no-img-element -- avatar URLs are runtime Supabase Storage assets. */

import { Bell, ChevronRight, Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/dashboard/search-bar";
import type { DashboardRow } from "@/components/dashboard/dashboard-utils";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { useWorkspaceIdentity } from "@/components/shared/workspace-provider";
import { canManageProjects } from "@/lib/permissions";

export function DashboardHeader({ workspaces }: { workspaces: DashboardRow[] }) {
  const pathname = usePathname();
  const identity = useWorkspaceIdentity();
  const routeLabel = pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ");
  const label = pathname === "/workspace" ? "Overview" : routeLabel === "assignments" ? "New project" : routeLabel ?? "Overview";
  const initials = identity.name.slice(0, 2).toUpperCase();
  const role = identity.role.toLowerCase().replace(/\s+/g, "_");
  const openNavigation = () => {
    window.dispatchEvent(new Event("cfy:open-mobile-navigation"));
  };
  return <header className="cfy-topbar sticky top-0 z-20 grid min-h-16 grid-cols-[auto_1fr_auto] items-center border-x-0 border-t-0 px-3 py-2 sm:h-[92px] sm:px-8"><div className="flex min-w-0 items-center gap-2 text-sm sm:gap-3"><button onClick={openNavigation} className="cfy-icon-button size-10 lg:hidden" aria-label="Open navigation" aria-controls="workspace-navigation"><Menu className="size-5" /></button><div className="hidden xl:block"><WorkspaceSwitcher workspaces={workspaces} /></div><span className="hidden text-zinc-500 md:inline xl:hidden">Workspace</span><ChevronRight className="hidden size-3.5 text-zinc-700 md:block" /><span className="hidden max-w-32 truncate font-medium capitalize text-zinc-200 md:block">{label}</span></div><div className="flex min-w-0 justify-center px-2 sm:px-5"><SearchBar /></div><div className="flex items-center gap-1 sm:gap-2"><Link href="/workspace/notifications" className="cfy-icon-button relative size-10 border border-white/[.09] bg-white/[.025]" aria-label="Open notifications"><Bell className="size-4 text-amber-200" /></Link>{canManageProjects(role) && <Link href="/workspace/assignments" className="cfy-primary-button hidden h-11 px-4 md:flex"><Plus className="size-4" />New project</Link>}<Link href="/workspace/profile" className="ml-0 flex min-w-0 items-center gap-2 rounded-xl p-1 transition hover:bg-white/[.05] sm:ml-1 sm:px-1.5" aria-label="Open profile"><span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-300/[.16] bg-violet-400/[.14] text-[10px] font-semibold text-violet-100">{identity.avatarUrl ? <img src={identity.avatarUrl} alt="" className="size-full object-cover" /> : initials}</span><span className="hidden min-w-0 text-left lg:block"><span className="block max-w-32 truncate text-xs font-semibold text-zinc-100">{identity.name}</span><span className="mt-0.5 block text-[10px] text-zinc-500">{identity.role}</span></span></Link></div></header>;
}
