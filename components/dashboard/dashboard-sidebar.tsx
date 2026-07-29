"use client";
/* eslint-disable @next/next/no-img-element -- workspace logo is a runtime Supabase Storage asset. */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, DollarSign, FolderKanban, FolderOpen, KanbanSquare, LayoutDashboard, LogOut, Plus, Settings, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateRecord } from "@/hooks/use-table";
import { useTableList } from "@/hooks/use-table";
import { createClient } from "@/supabase/client";
import { useWorkspaceIdentity } from "@/components/shared/workspace-provider";
import { rows } from "@/components/dashboard/dashboard-utils";
import { useNotificationsData } from "@/hooks/use-notifications-data";
import { canManageProjects, canManageWorkspace, canViewFinance, hasPermission } from "@/lib/permissions";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; indicator?: boolean };
const primaryNav: NavItem[] = [
  { label: "Overview", href: "/workspace", icon: LayoutDashboard },
  { label: "Projects", href: "/workspace/projects", icon: FolderKanban },
  { label: "Clients", href: "/workspace/clients", icon: Users },
  { label: "New project", href: "/workspace/assignments", icon: ClipboardCheck },
  { label: "Kanban", href: "/workspace/kanban", icon: KanbanSquare },
  { label: "Files", href: "/workspace/files", icon: FolderOpen },
  { label: "Calendar", href: "/workspace/calendar", icon: CalendarDays },
  { label: "Finance", href: "/workspace/finance", icon: DollarSign },
  { label: "Quality control", href: "/workspace/quality-control", icon: ShieldCheck },
];
const peopleNav: NavItem[] = [{ label: "Team", href: "/workspace/team", icon: Users, indicator: true }, { label: "Notifications", href: "/workspace/notifications", icon: Bell }];

export function DashboardSidebar({ email }: { email: string | null }) {
  void email;
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const createWorkspace = useCreateRecord("workspaces");
  const identity = useWorkspaceIdentity();
  const projects = useTableList("projects", { orderBy: "updated_at" });
  const notifications = useNotificationsData("all", "");
  const role = identity.role.toLowerCase().replace(/\s+/g, "_");
  const visiblePrimaryNav = primaryNav.filter((item) => {
    if (["Projects", "Clients", "New project"].includes(item.label)) return canManageProjects(role);
    if (["Kanban", "Files", "Calendar"].includes(item.label)) return hasPermission(role, "view_assigned_work");
    if (item.label === "Finance") return canViewFinance(role);
    if (item.label === "Quality control") return canManageWorkspace(role);
    return true;
  });
  const visiblePeopleNav = peopleNav.filter((item) => item.label !== "Team" || hasPermission(role, "manage_team"));
  const initials = identity.name.slice(0, 2).toUpperCase();
  const isActive = (href: string) => pathname === href || (href !== "/workspace" && pathname.startsWith(`${href}/`));
  const navClass = (active: boolean) => ["cfy-nav-item relative", collapsed ? "justify-center px-0" : "", active ? "cfy-nav-item-active" : ""].filter(Boolean).join(" ");
  const activeDot = (active: boolean) => active ? <span className={`${collapsed ? "absolute right-1.5 top-1.5" : "ml-auto"} size-1.5 rounded-full bg-violet-300 shadow-[0_0_12px_rgba(169,157,255,.9)]`} /> : null;
  const projectCount = rows(projects.data).length;
  const unreadCount = notifications.unreadCount.data ?? 0;
  const renderNav = (items: NavItem[]) => items.map(({ label, href, icon: Icon, indicator }) => {
    const active = isActive(href);
    const badge = label === "Projects" ? projectCount : label === "Notifications" ? unreadCount : 0;
    return <Link key={label} href={href} title={collapsed ? label : undefined} className={navClass(active)}><Icon /><span className={collapsed ? "sr-only" : ""}>{label}</span>{!collapsed && badge > 0 && <span className={`ml-auto flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${label === "Notifications" ? "bg-violet-500 text-white" : "bg-white/[.08] text-zinc-400"}`}>{badge}</span>}{!collapsed && indicator && <span className="ml-auto size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,.8)]" />}{activeDot(active)}</Link>;
  });
  const utility = (label: string, href: string, Icon: typeof UserRound) => <Link href={href} title={collapsed ? label : undefined} className={navClass(isActive(href))}><Icon /><span className={collapsed ? "sr-only" : ""}>{label}</span>{activeDot(isActive(href))}</Link>;
  const createWorkspaceRecord = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const name = workspaceName.trim(); if (name.length < 2) return toast.error("Enter a workspace name."); try { await createWorkspace.mutateAsync({ name }); toast.success(`${name} workspace created`); setWorkspaceName(""); setCreateOpen(false); setWorkspaceOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn’t create workspace."); } };
  const signOut = async () => { const { error } = await createClient().auth.signOut(); if (error) return toast.error(error.message); router.replace("/login"); router.refresh(); };

  return <div className={`hidden h-svh shrink-0 lg:block ${collapsed ? "w-20" : "w-64"}`}><aside className={`cfy-sidebar fixed inset-y-0 left-0 z-30 hidden h-svh flex-col overflow-visible transition-[width,padding] duration-300 lg:flex ${collapsed ? "w-20 px-2 py-4" : "w-64 px-3 py-4"}`}>
    <div className={`relative flex items-center ${collapsed ? "flex-col gap-3 pt-7" : "gap-2 px-2"}`}>
      <button onClick={() => setWorkspaceOpen((open) => !open)} aria-expanded={workspaceOpen} aria-label="Switch workspace" className={`flex min-w-0 items-center text-left ${collapsed ? "justify-center" : "gap-2"}`}>
        <WorkspaceMark key={identity.workspaceLogoUrl} logoUrl={identity.workspaceLogoUrl} label={identity.workspaceName} />
        {!collapsed && <span className="min-w-0"><span className="block truncate text-[15px] font-semibold tracking-[-.04em] text-zinc-100">{identity.workspaceName}</span><span className="mt-0.5 block whitespace-nowrap text-[11px] text-zinc-500">Owner workspace</span></span>}
      </button>
      {!collapsed && <button onClick={() => setWorkspaceOpen((open) => !open)} aria-label="Open workspace menu" className="ml-auto rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[.05] hover:text-zinc-200"><ChevronDown className={`size-3.5 transition ${workspaceOpen ? "rotate-180" : ""}`} /></button>}
      <button onClick={() => setCollapsed((value) => !value)} className={`${collapsed ? "absolute right-0 top-0" : "ml-1"} flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[.12] bg-[#152039] text-zinc-300 transition hover:border-violet-300/50 hover:text-white`} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>{collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
      {workspaceOpen && <div className="absolute left-0 top-[64px] z-50 w-[298px] rounded-[16px] border border-white/[.12] bg-[#172138] p-2 shadow-[0_22px_48px_rgba(0,0,0,.48)]"><button onClick={() => { setWorkspaceOpen(false); toast.success(`${identity.workspaceName} workspace selected`); }} className="flex w-full items-center gap-3 rounded-xl bg-[#202b43] p-3 text-left"><WorkspaceMark key={identity.workspaceLogoUrl} logoUrl={identity.workspaceLogoUrl} label={identity.workspaceName} size="size-8" /><span className="flex-1"><span className="block text-sm font-semibold text-zinc-100">{identity.workspaceName}</span><span className="block text-[11px] text-zinc-500">Owner workspace</span></span><Check className="size-4 text-rose-400" /></button><button onClick={() => setCreateOpen(true)} className="mt-1 flex w-full items-center gap-3 rounded-xl border border-white/[.08] bg-[#1c263b] p-3 text-left text-zinc-200 transition hover:bg-[#26324d]"><span className="flex size-8 items-center justify-center rounded-lg border border-dashed border-white/[.25]"><Plus className="size-4" /></span><span className="text-sm font-medium">Create workspace</span></button></div>}
    </div>
    {!collapsed && <div className="mt-6 h-px bg-gradient-to-r from-blue-400 via-blue-400/25 to-transparent" />}
    <nav className={`${collapsed ? "mt-7" : "mt-3"} space-y-0.5 [&_.cfy-nav-item]:h-9`}>{renderNav(visiblePrimaryNav)}</nav>
    {!collapsed && <p className="mt-5 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">People</p>}
    <nav className={`${collapsed ? "mt-4" : "mt-1.5"} space-y-0.5 [&_.cfy-nav-item]:h-9`}>{renderNav(visiblePeopleNav)}</nav>
    {!collapsed && <p className="mt-5 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">Workspace</p>}
    <nav className={`${collapsed ? "mt-4" : "mt-1.5"} space-y-0.5 [&_.cfy-nav-item]:h-9`}>{utility("Profile", "/workspace/profile", UserRound)}{canManageWorkspace(role) && utility("Settings", "/workspace/settings", Settings)}</nav>
    {!collapsed && <div className="relative mt-auto border-t border-white/[.08] pt-4"><p className="mb-2 flex items-center justify-between px-3 text-[11px] text-zinc-500"><span>Team capacity</span><strong className="font-semibold text-zinc-300">68%</strong></p><div className="mx-3 h-1.5 overflow-hidden rounded-full bg-white/[.07]"><span className="block h-full w-[68%] rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_10px_rgba(244,63,94,.55)]" /></div><button onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} className="cfy-profile mt-4 w-full text-left"><span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-[10px] font-bold text-white shadow-[0_0_18px_rgba(139,92,246,.25)]">{identity.avatarUrl ? <img src={identity.avatarUrl} alt="" className="size-full object-cover" /> : initials}<span className="absolute bottom-0.5 right-0.5 size-2 rounded-full border border-[#172138] bg-emerald-400" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-zinc-100">{identity.name}</span><span className="mt-0.5 block text-[10px] text-zinc-500">{identity.role} <span className="text-emerald-300">· Online</span></span></span><span className="text-zinc-500">•••</span></button>{profileOpen && <div className="absolute bottom-14 left-0 z-50 w-full rounded-[16px] border border-white/[.12] bg-[#172138] p-2 shadow-[0_22px_48px_rgba(0,0,0,.48)]"><Link href="/workspace/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-200 transition hover:bg-[#202b43]"><UserRound className="size-4" />{identity.name}&apos;s profile</Link><Link href="/workspace/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-200 transition hover:bg-[#202b43]"><Settings className="size-4" />Workspace settings</Link><button onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-zinc-200 transition hover:bg-[#202b43]"><LogOut className="size-4" />Logout</button></div>}</div>}
  </aside>{createOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"><form onSubmit={(event) => void createWorkspaceRecord(event)} className="cfy-modal w-full max-w-md"><div className="flex items-start justify-between"><div><h2 className="text-xl font-semibold text-white">Create workspace</h2><p className="mt-1 text-sm text-zinc-500">Start a separate workspace for a new team or client group.</p></div><button type="button" onClick={() => setCreateOpen(false)} className="cfy-icon-button size-9"><X className="size-4" /></button></div><label className="auth-field mt-6"><span>Workspace name</span><input autoFocus value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="e.g. Northstar Studio" className="auth-input" /></label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCreateOpen(false)} className="cfy-icon-button h-10 px-4 text-sm">Cancel</button><button disabled={createWorkspace.isPending} className="cfy-primary-button h-10 px-4">{createWorkspace.isPending ? "Creating…" : "Create workspace"}</button></div></form></div>}</div>;
}

function WorkspaceMark({ logoUrl, label, size = "size-12" }: { logoUrl: string; label: string; size?: string }) {
  const [failed, setFailed] = useState(false);
  return <span className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-[15px] border border-rose-400/15 bg-rose-500/[.12] text-rose-400 shadow-[0_0_28px_rgba(244,63,94,.1)]`}>{logoUrl && !failed ? <img src={logoUrl} alt="" className="size-full object-cover" onError={() => setFailed(true)} /> : <span className="flex size-6 items-center justify-center rounded-full border-2 border-current text-xs font-black" aria-label={`${label} logo`}>▲</span>}</span>;
}
