"use client";

import { useTableList } from "@/hooks/use-table";

/** All team intelligence is composed from existing production records. */
export function useTeamData() {
  const members = useTableList("team_members", { orderBy: "created_at" });
  const invitations = useTableList("team_invitations", { orderBy: "created_at" });
  const memberships = useTableList("workspace_memberships", { orderBy: "created_at" });
  const profiles = useTableList("profiles", { orderBy: "updated_at" });
  const metrics = useTableList("profile_metrics", { orderBy: "updated_at" });
  const projects = useTableList("projects", { orderBy: "updated_at" });
  const projectAssignments = useTableList("project_assignments", { orderBy: "created_at" });
  const assignments = useTableList("assignments", { orderBy: "updated_at" });
  const tasks = useTableList("tasks", { orderBy: "updated_at" });
  const files = useTableList("files", { orderBy: "updated_at" });
  const activity = useTableList("activity_logs", { orderBy: "created_at" });
  const calendar = useTableList("calendar_events", { orderBy: "start_at", ascending: true });
  const workspaces = useTableList("workspaces", { orderBy: "created_at" });

  return { members, invitations, memberships, profiles, metrics, projects, projectAssignments, assignments, tasks, files, activity, calendar, workspaces };
}
