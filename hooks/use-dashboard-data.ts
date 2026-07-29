"use client";

import { useTableList } from "@/hooks/use-table";

/**
 * Dashboard data is intentionally composed from the existing table hooks.
 * Each query remains independently cacheable and can fail without taking down
 * the rest of the workspace overview.
 */
export function useDashboardData() {
  const workspaces = useTableList("workspaces");
  const clients = useTableList("clients");
  const projects = useTableList("projects");
  const tasks = useTableList("tasks");
  const assignments = useTableList("assignments");
  const deliverables = useTableList("deliverables");
  const activity = useTableList("activity_logs");
  const teamMembers = useTableList("team_members");
  const memberships = useTableList("workspace_memberships");
  const calendarEvents = useTableList("calendar_events");

  return { workspaces, clients, projects, tasks, assignments, deliverables, activity, teamMembers, memberships, calendarEvents };
}
