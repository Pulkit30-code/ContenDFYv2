import { forbidden, unauthorized } from "next/navigation";
import { isSessionExpiredError, requireAuthenticatedServerContext } from "@/lib/auth";
import { hasPermission, type Permission, type WorkspaceRole } from "@/lib/permissions";

export { canApproveVideos, canAssignEditors, canManageProjects, canManageWorkspace, canViewFinance, hasPermission, hasRole } from "@/lib/permissions";
export type { Permission, WorkspaceRole } from "@/lib/permissions";

export async function requireWorkspacePermission(route: string, permission: Permission) {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedServerContext>>;
  try { auth = await requireAuthenticatedServerContext(route); } catch (error) {
    if (isSessionExpiredError(error)) unauthorized();
    throw error;
  }
  const { data, error } = await auth.supabase.from("workspace_memberships").select("workspace_id,role,is_active").eq("user_id", auth.user.id).eq("is_active", true).limit(1).maybeSingle();
  const role = data && typeof data.role === "string" ? data.role : null;
  if (error || !hasPermission(role, permission)) forbidden();
  return { user: auth.user, role: role as WorkspaceRole, workspaceId: data?.workspace_id ? String(data.workspace_id) : "" };
}
