"use client";

import { useTableList } from "@/hooks/use-table";

/** Calendar data is composed exclusively from existing production tables. */
export function useCalendarData() {
  const calendarEvents = useTableList("calendar_events", { orderBy: "start_at" });
  const assignments = useTableList("assignments", { orderBy: "due_date" });
  const projects = useTableList("projects", { orderBy: "updated_at" });
  const clients = useTableList("clients", { orderBy: "updated_at" });
  const deliverables = useTableList("deliverables", { orderBy: "due_date" });
  const teamMembers = useTableList("team_members", { orderBy: "created_at" });
  const memberships = useTableList("workspace_memberships", { orderBy: "created_at" });
  const attachments = useTableList("attachments", { orderBy: "created_at" });
  const comments = useTableList("task_comments", { orderBy: "created_at" });
  const activity = useTableList("activity_logs", { orderBy: "created_at" });
  const workspaces = useTableList("workspaces", { orderBy: "created_at" });
  return { calendarEvents, assignments, projects, clients, deliverables, teamMembers, memberships, attachments, comments, activity, workspaces };
}
