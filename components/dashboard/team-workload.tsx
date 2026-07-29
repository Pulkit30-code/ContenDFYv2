import { Users } from "lucide-react";
import { stringValue, type DashboardRow } from "@/components/dashboard/dashboard-utils";
import { EmptyState, WidgetError } from "@/components/dashboard/empty-state";
import { WidgetSkeleton } from "@/components/dashboard/loading-skeletons";

export function TeamWorkload({ team, tasks, isLoading, isError }: { team: DashboardRow[]; tasks: DashboardRow[]; isLoading: boolean; isError: boolean }) {
  const people = team.slice(0, 5);
  const taskCount = (person: DashboardRow) => { const id = String(person.user_id ?? person.profile_id ?? person.id ?? ""); return tasks.filter((task) => String(task.assignee_id ?? task.user_id ?? task.owner_id ?? "") === id).length; };
  return <section className="cfy-card">
    <div className="cfy-card-head flex items-center justify-between"><div><h2 className="text-sm font-semibold tracking-[-.015em] text-zinc-100">Team workload</h2><p className="mt-1 text-xs text-zinc-500">Tasks currently assigned to collaborators</p></div><span className="rounded-lg bg-violet-400/10 px-2 py-1 text-[10px] font-medium text-violet-200">Live capacity</span></div>
    {isLoading ? <WidgetSkeleton rows={4} /> : isError ? <WidgetError /> : !people.length ? <EmptyState icon={Users} title="No team members yet" description="Invite collaborators to start distributing work." /> : <div className="space-y-4 p-5">
      {people.map((person, index) => {
        const count = taskCount(person); const percentage = Math.min(100, count * 20); const name = stringValue(person, ["full_name", "name", "display_name", "email"], "Team member");
        return <div key={String(person.id ?? index)}><div className="flex items-center justify-between text-sm"><div className="flex min-w-0 items-center gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[.1] bg-gradient-to-br from-zinc-500 to-zinc-800 text-[10px] font-medium text-zinc-100">{name.slice(0, 2).toUpperCase()}</span><span className="truncate text-zinc-300">{name}</span></div><span className="text-xs text-zinc-500">{count} task{count === 1 ? "" : "s"}</span></div><div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-violet-300 shadow-[0_0_12px_rgba(139,124,255,.45)]" style={{ width: `${Math.max(7, percentage)}%` }} /></div></div>;
      })}
    </div>}
  </section>;
}
