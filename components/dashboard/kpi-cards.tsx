"use client";

import type { CSSProperties } from "react";
import { Banknote, Check, FolderKanban, Inbox, RefreshCw, Users } from "lucide-react";
import { statusValue, type DashboardRow } from "@/components/dashboard/dashboard-utils";
import { Skeleton } from "@/components/dashboard/loading-skeletons";
import { useWorkspaceIdentity } from "@/components/shared/workspace-provider";

type Metric = {
  label: string;
  value: string | number;
  description: string;
  icon: typeof FolderKanban;
  glow: string;
  trend: string;
};

const sparkBars = [5, 9, 7, 12, 10, 15] as const;

export function KpiCards({ projects, assignments, team, isLoading }: { projects: DashboardRow[]; assignments: DashboardRow[]; team: DashboardRow[]; isLoading: boolean }) {
  const { currencySymbol } = useWorkspaceIdentity();
  if (isLoading) return <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">{Array.from({ length: 7 }, (_, index) => <Skeleton className="h-[136px] min-w-0" key={`metric-skeleton-${index}`} />)}</div>;

  const assignmentStatus = (pattern: RegExp) => assignments.filter((item) => pattern.test(statusValue(item))).length;
  const activeProjects = projects.filter((project) => !/complete|deliver|archive|cancel/i.test(statusValue(project))).length;
  const newRequests = assignmentStatus(/draft|new|request|queued/i);
  const pendingReviews = assignmentStatus(/review|approval/i);
  const completed = projects.filter((project) => /complete|deliver/i.test(statusValue(project))).length;
  const changes = assignmentStatus(/revision|change/i);
  const metrics: Metric[] = [
    { label: "Active projects", value: activeProjects, description: `${activeProjects} due this week`, icon: FolderKanban, glow: "#8b7cff", trend: "Live" },
    { label: "New requests", value: newRequests, description: `${newRequests} ready to assign`, icon: Inbox, glow: "#7dd3fc", trend: "Inbox" },
    { label: "In review", value: pendingReviews, description: `${pendingReviews} awaiting review`, icon: Check, glow: "#a78bfa", trend: "Queue" },
    { label: "Completed", value: completed, description: "Delivered projects", icon: Check, glow: "#8b7cff", trend: "Month" },
    { label: "Changes", value: changes, description: `${changes} need attention`, icon: RefreshCw, glow: "#c4b5fd", trend: "Review" },
    { label: "Team members", value: team.length, description: `${team.length} available`, icon: Users, glow: "#a78bfa", trend: "Online" },
    { label: "Revenue", value: `${currencySymbol}0`, description: "From available budgets", icon: Banknote, glow: "#8b7cff", trend: "Month" },
  ];

  return <section aria-label="Business metrics" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">{metrics.map((metric) => <KpiMetric key={metric.label} metric={metric} />)}</section>;
}

function KpiMetric({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return <article className="cfy-kpi h-[136px] min-w-0 p-3" style={{ "--kpi-glow": metric.glow } as CSSProperties}>
    <div className="relative flex items-center justify-between gap-1"><p className="min-w-0 truncate text-[9px] font-semibold uppercase tracking-[.06em] text-zinc-500">{metric.label}</p><span className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-violet-400/[.12] text-violet-200"><Icon className="size-3" /></span></div>
    <div className="relative mt-3 flex items-end justify-between gap-1"><p className="text-[27px] font-semibold leading-none tracking-[-.06em] text-zinc-50">{metric.value}</p><span className="mb-0.5 hidden text-[9px] font-medium text-zinc-400 2xl:block">{metric.trend}</span></div>
    <div className="relative mt-2.5 flex items-end justify-between gap-1"><p className="min-w-0 truncate text-[10px] text-zinc-500">{metric.description}</p><div className="hidden shrink-0 items-end gap-0.5 opacity-80 2xl:flex" aria-hidden="true">{sparkBars.map((height) => <span key={`${metric.label}-${height}`} className="w-1 rounded-full bg-[var(--kpi-glow)]" style={{ height: Math.round(height * 0.75) }} />)}</div></div>
  </article>;
}
