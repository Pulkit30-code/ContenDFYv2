import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { stringValue, type DashboardRow } from "@/components/dashboard/dashboard-utils";
import { EmptyState, WidgetError } from "@/components/dashboard/empty-state";
import { WidgetSkeleton } from "@/components/dashboard/loading-skeletons";

export function TopPerformingEditors({ team, tasks, isLoading, isError }: { team: DashboardRow[]; tasks: DashboardRow[]; isLoading: boolean; isError: boolean }) {
  const performers = team.map((person) => {
    const id = String(person.user_id ?? person.profile_id ?? person.id ?? "");
    const activeTasks = tasks.filter((task) => String(task.assignee_id ?? task.user_id ?? task.owner_id ?? "") === id).length;
    return { person, activeTasks };
  }).sort((a, b) => b.activeTasks - a.activeTasks).slice(0, 5);

  return <section className="cfy-card"><div className="cfy-card-head flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-amber-200 text-amber-950"><Users className="size-4" /></span><div><h2 className="text-sm font-semibold tracking-[-.015em] text-zinc-100">Best Performance Editors</h2><p className="mt-1 text-xs text-zinc-500">Top performers this month</p></div></div><Link href="/workspace/team" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 transition hover:text-white">View full team <ArrowUpRight className="size-3.5" /></Link></div>{isLoading ? <WidgetSkeleton rows={4} /> : isError ? <WidgetError /> : !performers.length ? <EmptyState icon={Users} title="No performance data yet" description="Team performance will appear here as work is assigned." /> : <div className="divide-y divide-white/[.06]">{performers.map(({ person, activeTasks }) => { const name = stringValue(person, ["full_name", "name", "display_name", "email"], "Team member"); return <div key={String(person.id ?? person.user_id ?? name)} className="cfy-list-row flex items-center gap-4 px-5 py-3.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[.09] bg-violet-400/10 text-[11px] font-semibold text-violet-100">{name.slice(0, 2).toUpperCase()}</span><p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">{name}</p><p className="hidden text-xs text-zinc-500 sm:block">{activeTasks} active task{activeTasks === 1 ? "" : "s"}</p><span className="cfy-status">Active</span></div>; })}</div>}</section>;
}
