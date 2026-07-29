import { requireWorkspacePermission } from "@/lib/rbac";
import { AssignmentsContent } from "@/components/assignments/assignments-content";

export default async function AssignmentsPage() {
  const { user } = await requireWorkspacePermission("/workspace/assignments", "manage_projects");
  return <AssignmentsContent email={user.email} />;
}
