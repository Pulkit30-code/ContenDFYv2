export const roles = ["owner", "project_manager", "editor", "client"] as const;
export type WorkspaceRole = (typeof roles)[number];
export type Permission = "manage_workspace" | "manage_billing" | "manage_integrations" | "manage_team" | "manage_projects" | "manage_kanban" | "view_finance" | "view_clients" | "view_assigned_work" | "view_profile" | "view_notifications";

const permissions: Record<WorkspaceRole, readonly Permission[]> = {
  owner: ["manage_workspace", "manage_billing", "manage_integrations", "manage_team", "manage_projects", "manage_kanban", "view_finance", "view_clients", "view_assigned_work", "view_profile", "view_notifications"],
  // Finance is intentionally owner-only. Project managers retain operational
  // workspace access but cannot open the finance area.
  project_manager: ["manage_workspace", "manage_integrations", "manage_team", "manage_projects", "manage_kanban", "view_clients", "view_assigned_work", "view_profile", "view_notifications"],
  // Editors participate in the operational workspace: projects, clients,
  // team, notifications, and settings. They never receive finance access.
  editor: ["manage_workspace", "manage_team", "manage_projects", "manage_kanban", "view_clients", "view_assigned_work", "view_profile", "view_notifications"],
  client: ["view_assigned_work", "view_profile", "view_notifications"],
};

export function hasRole(role: string | null | undefined, allowed: readonly WorkspaceRole[]) { return Boolean(role && allowed.includes(role as WorkspaceRole)); }
export function hasPermission(role: string | null | undefined, permission: Permission) { return Boolean(role && permissions[role as WorkspaceRole]?.includes(permission)); }
export const canManageProjects = (role: string | null | undefined) => hasPermission(role, "manage_projects");
export const canManageWorkspace = (role: string | null | undefined) => hasPermission(role, "manage_workspace");
export const canAssignEditors = (role: string | null | undefined) => hasPermission(role, "manage_projects");
export const canApproveVideos = (role: string | null | undefined) => hasRole(role, ["owner", "project_manager", "client"]);
export const canViewFinance = (role: string | null | undefined) => hasPermission(role, "view_finance");
