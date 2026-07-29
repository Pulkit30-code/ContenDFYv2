import { requireWorkspacePermission } from "@/lib/rbac";
import { FilesContent } from "@/components/files/files-content";

export default async function FilesPage() {
  const { user } = await requireWorkspacePermission("/workspace/files", "view_assigned_work");
  return <FilesContent email={user.email} />;
}
