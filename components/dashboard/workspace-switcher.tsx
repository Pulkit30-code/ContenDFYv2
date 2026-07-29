"use client";
/* eslint-disable @next/next/no-img-element -- workspace logo is a runtime Supabase Storage asset. */

import { Check, ChevronDown, Layers3 } from "lucide-react";
import { useState } from "react";
import { stringValue, type DashboardRow } from "@/components/dashboard/dashboard-utils";
import { useWorkspaceIdentity } from "@/components/shared/workspace-provider";

function WorkspaceLogo({ src, size = "size-full", fallbackSize = "size-3.5" }: { src: string; size?: string; fallbackSize?: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt="" className={`${size} object-cover`} onError={() => setFailed(true)} /> : <Layers3 className={`m-auto ${fallbackSize} text-violet-200`} />;
}

export function WorkspaceSwitcher({ workspaces }: { workspaces: DashboardRow[] }) {
  const [open, setOpen] = useState(false);
  const identity = useWorkspaceIdentity();
  const visibleWorkspaces = identity.workspaces.length ? identity.workspaces : workspaces;
  return <div className="relative"><button onClick={() => setOpen((value) => !value)} className="cfy-control flex h-10 max-w-52 items-center gap-2.5 px-3 text-sm font-medium"><span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-violet-300/[.12] bg-violet-400/[.10] text-violet-200"><WorkspaceLogo key={identity.workspaceLogoUrl} src={identity.workspaceLogoUrl} /></span><span className="truncate">{identity.workspaceName || "My workspace"}</span><ChevronDown className={`size-3.5 text-zinc-500 transition ${open ? "rotate-180" : ""}`} /></button>{open && <div className="absolute left-0 top-12 z-30 w-60 overflow-hidden rounded-[16px] border border-white/[.12] bg-[#1a191f]/95 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,.48)] backdrop-blur-2xl">{visibleWorkspaces.length ? visibleWorkspaces.map((workspace, index) => { const selected = String(workspace.id ?? "") === identity.workspaceId; return <button key={String(workspace.id ?? index)} onClick={() => { identity.selectWorkspace(String(workspace.id ?? "")); setOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-white/[.07]"><span className="flex min-w-0 items-center gap-2"><span className="flex size-6 shrink-0 overflow-hidden rounded-md bg-violet-400/[.1]">{selected ? <WorkspaceLogo key={identity.workspaceLogoUrl} src={identity.workspaceLogoUrl} size="size-full" fallbackSize="size-3" /> : <Layers3 className="m-auto size-3 text-violet-200" />}</span><span className="truncate">{stringValue(workspace, ["name", "title", "workspace_name"], "Workspace")}</span></span>{selected && <Check className="size-3.5 text-violet-300" />}</button>; }) : <p className="px-3 py-3 text-xs text-zinc-500">No workspaces available.</p>}</div>}</div>;
}
