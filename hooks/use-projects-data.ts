"use client";

import { useTableList } from "@/hooks/use-table";

/** Queries used across the Projects list and project workspace. */
export function useProjectsData() {
  const projects = useTableList("projects", { orderBy: "updated_at" });
  const clients = useTableList("clients", { orderBy: "updated_at" });
  const deliverables = useTableList("deliverables", { orderBy: "due_date", ascending: true });
  const files = useTableList("files", { orderBy: "updated_at" });
  const activity = useTableList("activity_logs", { orderBy: "created_at" });
  const comments = useTableList("task_comments", { orderBy: "created_at" });
  const assignments = useTableList("project_assignments", { orderBy: "created_at" });
  const teamMembers = useTableList("team_members", { orderBy: "created_at" });
  const memberships = useTableList("workspace_memberships", { orderBy: "created_at" });
  const workspaces = useTableList("workspaces", { orderBy: "created_at" });

  return { projects, clients, deliverables, files, activity, comments, assignments, teamMembers, memberships, workspaces };
}
