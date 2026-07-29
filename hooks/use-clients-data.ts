"use client";

import { useTableList } from "@/hooks/use-table";

/** Data needed by the Clients workspace. Queries remain independently cached. */
export function useClientsData() {
  const clients = useTableList("clients", { orderBy: "updated_at" });
  const projects = useTableList("projects", { orderBy: "updated_at" });
  const activity = useTableList("activity_logs", { orderBy: "created_at" });
  const workspaces = useTableList("workspaces");
  return { clients, projects, activity, workspaces };
}
