"use client";

import { useTableList } from "@/hooks/use-table";

/** File manager data stays split into the app's existing cacheable table queries. */
export function useFilesData() {
  const files = useTableList("files", { orderBy: "updated_at" });
  const clients = useTableList("clients", { orderBy: "updated_at" });
  const projects = useTableList("projects", { orderBy: "updated_at" });
  const assignments = useTableList("assignments", { orderBy: "updated_at" });
  const members = useTableList("team_members");
  const activity = useTableList("activity_logs", { orderBy: "created_at" });
  const revisions = useTableList("frameio_revisions", { orderBy: "created_at" });
  const comments = useTableList("task_comments", { orderBy: "created_at" });
  const workspaces = useTableList("workspaces");
  return { files, clients, projects, assignments, members, activity, revisions, comments, workspaces };
}
