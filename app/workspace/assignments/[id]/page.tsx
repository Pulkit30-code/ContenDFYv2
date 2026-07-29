import { requireWorkspacePermission } from "@/lib/rbac";
import { AssignmentDetailsContent } from "@/components/assignments/assignments-content";

export default async function AssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireWorkspacePermission(`/workspace/assignments/${id}`, "manage_projects");
  return <AssignmentDetailsContent email={user.email} id={id} />;
}
