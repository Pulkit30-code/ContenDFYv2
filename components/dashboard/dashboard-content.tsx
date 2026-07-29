"use client";

import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { rows } from "@/components/dashboard/dashboard-utils";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardSkeleton } from "@/components/dashboard/loading-skeletons";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { StatusDistribution } from "@/components/dashboard/status-distribution";
import { TeamWorkload } from "@/components/dashboard/team-workload";
import { TopPerformingEditors } from "@/components/dashboard/top-performing-editors";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useWorkspaceIdentity } from "@/components/shared/workspace-provider";
import { canManageProjects } from "@/lib/permissions";

export function DashboardContent({ email }: { email: string | null }) {
  const data = useDashboardData();
  const identity = useWorkspaceIdentity();
  const workspaces = rows(data?.workspaces?.data);
  const clients = rows(data?.clients?.data);
  const projects = rows(data?.projects?.data);
  const tasks = rows(data?.tasks?.data);
  const assignments = rows(data?.assignments?.data);
  const deliverables = rows(data?.deliverables?.data);
  const activity = rows(data?.activity?.data);
  const teamMembers = rows(data?.teamMembers?.data);
  const memberships = rows(data?.memberships?.data);
  const events = rows(data?.calendarEvents?.data);
  const team = teamMembers.length ? teamMembers : memberships;
  const workspacesLoading = data?.workspaces?.isLoading ?? false;
  const clientsLoading = data?.clients?.isLoading ?? false;
  const projectsLoading = data?.projects?.isLoading ?? false;
  const tasksLoading = data?.tasks?.isLoading ?? false;
  const assignmentsLoading = data?.assignments?.isLoading ?? false;
  const deliverablesLoading = data?.deliverables?.isLoading ?? false;
  const activityLoading = data?.activity?.isLoading ?? false;
  const teamMembersLoading = data?.teamMembers?.isLoading ?? false;
  const membershipsLoading = data?.memberships?.isLoading ?? false;
  const calendarEventsLoading = data?.calendarEvents?.isLoading ?? false;
  const assignmentsError = data?.assignments?.isError ?? false;
  const projectsError = data?.projects?.isError ?? false;
  const deliverablesError = data?.deliverables?.isError ?? false;
  const tasksError = data?.tasks?.isError ?? false;
  const calendarEventsError = data?.calendarEvents?.isError ?? false;
  const teamMembersError = data?.teamMembers?.isError ?? false;
  const membershipsError = data?.memberships?.isError ?? false;
  const activityError = data?.activity?.isError ?? false;
  const role = identity.role.toLowerCase().replace(/\s+/g, "_");
  const isManager = canManageProjects(role);

  if (workspacesLoading && projectsLoading && tasksLoading) return <DashboardSkeleton />;

  return <motion.div initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="cfy-shell text-zinc-100 lg:flex"><DashboardSidebar email={email} /><div className="relative min-w-0 flex-1"><DashboardHeader workspaces={workspaces} /><main className="relative mx-auto w-full max-w-[1560px] px-4 py-7 sm:px-6 lg:px-8 xl:px-10"><motion.div initial={false} animate={{ opacity: 1 }} className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-semibold tracking-[-.055em] text-white sm:text-[2.25rem]">Good afternoon, {identity.name}</h1><p className="mt-2 text-sm text-zinc-500">{isManager ? "Full command center for ContenDFY: revenue, team capacity, delivery, settings, and workspace controls." : "Your focused workspace for assigned work, delivery updates, and collaboration."}</p></div><span className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex"><span className="size-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.75)]" />{isManager ? "Automation systems online" : "Assigned-work view"}</span></motion.div>{isManager ? <><div className="cfy-fade-up cfy-fade-up-delay-1"><KpiCards projects={projects} assignments={assignments} team={team} isLoading={projectsLoading || assignmentsLoading || teamMembersLoading || membershipsLoading} /></div><div className="cfy-fade-up cfy-fade-up-delay-2 mt-6"><UpcomingDeadlines deliverables={deliverables} tasks={tasks} events={events} projects={projects} clients={clients} team={team} isLoading={deliverablesLoading || tasksLoading || calendarEventsLoading || clientsLoading} isError={deliverablesError && tasksError && calendarEventsError} /></div><div className="cfy-fade-up cfy-fade-up-delay-3 mt-5 grid gap-5 xl:grid-cols-3"><TeamWorkload team={team} tasks={tasks} isLoading={teamMembersLoading || membershipsLoading || tasksLoading} isError={teamMembersError && membershipsError} /><StatusDistribution assignments={assignments} isLoading={assignmentsLoading} isError={assignmentsError} /><QuickActions /></div><div className="cfy-fade-up cfy-fade-up-delay-3 mt-5"><TopPerformingEditors team={team} tasks={tasks} isLoading={teamMembersLoading || membershipsLoading || tasksLoading} isError={teamMembersError && membershipsError} /></div><div className="cfy-fade-up cfy-fade-up-delay-3 mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]"><RecentProjects projects={projects} clients={clients} team={team} isLoading={projectsLoading || clientsLoading} isError={projectsError} /><ActivityFeed activity={activity} isLoading={activityLoading} isError={activityError} /></div></> : <div className="grid gap-5 xl:grid-cols-[1.4fr_.9fr]"><UpcomingDeadlines deliverables={deliverables} tasks={tasks} events={events} projects={projects} clients={clients} team={team} isLoading={deliverablesLoading || tasksLoading || calendarEventsLoading || clientsLoading} isError={deliverablesError && tasksError && calendarEventsError} /><ActivityFeed activity={activity} isLoading={activityLoading} isError={activityError} /></div>}</main></div></motion.div>;
}
