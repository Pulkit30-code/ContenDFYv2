"use client";

import { useTableList } from "@/hooks/use-table";

/** Data composition for the assignment control plane. All records come from existing production tables. */
export function useAssignmentsData() {
  const assignments = useTableList("assignments", { orderBy: "updated_at" });
  const projects = useTableList("projects", { orderBy: "updated_at" });
  const clients = useTableList("clients", { orderBy: "updated_at" });
  const teamMembers = useTableList("team_members", { orderBy: "created_at" });
  const memberships = useTableList("workspace_memberships", { orderBy: "created_at" });
  const files = useTableList("files", { orderBy: "updated_at" });
  const attachments = useTableList("attachments", { orderBy: "created_at" });
  const comments = useTableList("task_comments", { orderBy: "created_at" });
  const activity = useTableList("activity_logs", { orderBy: "created_at" });
  const revisions = useTableList("frameio_revisions", { orderBy: "created_at" });
  const workspaces = useTableList("workspaces", { orderBy: "created_at" });
  return { assignments, projects, clients, teamMembers, memberships, files, attachments, comments, activity, revisions, workspaces };
}
