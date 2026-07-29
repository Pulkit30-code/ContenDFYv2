"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { PieChart } from "lucide-react";
import { labelize, statusValue, type DashboardRow } from "@/components/dashboard/dashboard-utils";
import { EmptyState, WidgetError } from "@/components/dashboard/empty-state";
import { WidgetSkeleton } from "@/components/dashboard/loading-skeletons";

const chartColors = ["#a99dff", "#8b7cff", "#6f65c5", "#a7a7b2", "#74747f", "#4d4d56", "#b6adff", "#8580a6", "#616176"];

export function StatusDistribution({ assignments, isLoading, isError }: { assignments: DashboardRow[]; isLoading: boolean; isError: boolean }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const entries = useMemo(() => Object.entries(assignments.reduce<Record<string, number>>((output, assignment) => { const status = statusValue(assignment); output[status] = (output[status] ?? 0) + 1; return output; }, {})).sort(([, left], [, right]) => right - left), [assignments]);
  const total = assignments.length;
  const active = entries.find(([status]) => status === hovered) ?? entries[0];

  return <section className="cfy-card"><div className="cfy-card-head"><h2 className="text-sm font-semibold tracking-[-.015em] text-zinc-100">Project status distribution</h2><p className="mt-1 text-xs text-zinc-500">Live data from the Kanban board</p></div>{isLoading ? <WidgetSkeleton rows={4} /> : isError ? <WidgetError /> : !entries.length ? <EmptyState icon={PieChart} title="No project status data available." description="Kanban workflow data will appear here when assignments are created." /> : <div className="grid gap-6 p-5 sm:grid-cols-[190px_1fr] sm:items-center"><div className="relative mx-auto size-48"><svg className="size-full -rotate-90" viewBox="0 0 42 42" role="img" aria-label="Kanban status distribution">{entries.map(([status, count], index) => { const previous = entries.slice(0, index).reduce((sum, [, value]) => sum + value, 0); const percentage = (count / total) * 100; return <motion.circle key={status} cx="21" cy="21" r="15.9155" fill="transparent" stroke={chartColors[index % chartColors.length]} strokeWidth="5" strokeDasharray={`${percentage} ${100 - percentage}`} strokeDashoffset={-previous} strokeLinecap="butt" initial={false} animate={{ strokeDasharray: mounted ? `${percentage} ${100 - percentage}` : `0 100` }} transition={{ duration: .55, delay: index * .045 }} onMouseEnter={() => setHovered(status)} onFocus={() => setHovered(status)} tabIndex={0} className="cursor-default outline-none transition-opacity hover:opacity-80 focus:opacity-80" />; })}</svg><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="font-mono text-2xl font-medium tracking-[-.06em] text-zinc-100">{active ? Math.round((active[1] / total) * 100) : 0}%</strong><span className="mt-1 max-w-24 truncate text-center text-[10px] text-zinc-500">{active ? labelize(active[0]) : "Status"}</span></div></div><div className="grid grid-cols-2 gap-x-5 gap-y-3">{entries.map(([status, count], index) => <button key={status} onMouseEnter={() => setHovered(status)} onFocus={() => setHovered(status)} className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition ${hovered === status ? "bg-white/[.05]" : "hover:bg-white/[.025]"}`}><span className="flex min-w-0 items-center gap-2 text-xs text-zinc-400"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span className="truncate">{labelize(status)}</span></span><span className="font-mono text-xs font-medium text-zinc-200">{count}</span></button>)}</div></div>}</section>;
}
