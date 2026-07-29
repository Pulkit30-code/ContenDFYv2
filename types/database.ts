/**
 * Production schema contract generated from the connected Supabase project on
 * 2026-07-23. This file is application-only: it never runs DDL.
 *
 * Keep the table names in sync with Supabase. Column-specific types are exposed
 * through the row/input aliases in `types/models.ts`; the generic record shape
 * allows this data layer to support every production table consistently.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TableShape = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export const tableNames = [
  "activity_logs", "assignments", "attachments", "calendar_events", "clients",
  "deliverables", "files", "finance_events", "finance_expenses", "finance_invoice_items",
  "finance_invoices", "finance_payments", "frameio_approval_history", "frameio_assets",
  "frameio_folders", "frameio_integrations", "frameio_project_cache", "frameio_project_mappings",
  "frameio_review_comments", "frameio_reviews", "frameio_revisions", "frameio_webhook_events",
  "frameio_webhooks", "kanban_columns", "notifications", "profile_metrics", "profiles",
  "project_assignments", "projects", "quality_control_files", "quality_control_issues",
  "quality_control_reports", "quality_control_scores", "slack_delivery_audit_logs",
  "slack_integrations", "slack_notification_queue", "slack_oauth_states", "task_comments",
  "tasks", "team_invitations", "team_members", "workspace_invitations", "workspace_memberships",
  "workspace_settings", "workspaces",
] as const;

export type TableName = (typeof tableNames)[number];
type Tables = { [K in TableName]: TableShape };

type Functions = {
  activate_workspace_invitation: {
    Args: { invitation_id: string; activating_user: string };
    Returns: Record<string, unknown>;
  };
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: { Tables: Tables; Views: Record<never, never>; Functions: Functions; Enums: Record<never, never>; CompositeTypes: Record<never, never> };
};

export type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> = Database["public"]["Tables"][T]["Update"];

/** The only production table whose primary key is not `id`. */
export const primaryKeyByTable: Record<TableName, string> = {
  activity_logs: "id", assignments: "id", attachments: "id", calendar_events: "id", clients: "id",
  deliverables: "id", files: "id", finance_events: "id", finance_expenses: "id", finance_invoice_items: "id",
  finance_invoices: "id", finance_payments: "id", frameio_approval_history: "id", frameio_assets: "id",
  frameio_folders: "id", frameio_integrations: "id", frameio_project_cache: "id", frameio_project_mappings: "id",
  frameio_review_comments: "id", frameio_reviews: "id", frameio_revisions: "id", frameio_webhook_events: "id",
  frameio_webhooks: "id", kanban_columns: "id", notifications: "id", profile_metrics: "id", profiles: "id",
  project_assignments: "id", projects: "id", quality_control_files: "id", quality_control_issues: "id",
  quality_control_reports: "id", quality_control_scores: "id", slack_delivery_audit_logs: "id",
  slack_integrations: "id", slack_notification_queue: "id", slack_oauth_states: "id", task_comments: "id",
  tasks: "id", team_invitations: "id", team_members: "id", workspace_invitations: "id",
  workspace_memberships: "id", workspace_settings: "workspace_id", workspaces: "id",
};
