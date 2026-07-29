import { requireWorkspacePermission } from "@/lib/rbac";
import { QualityControlContent } from "@/components/quality-control/quality-control-content";

export default async function QualityControlPage() {
  const { user } = await requireWorkspacePermission("/workspace/quality-control", "view_assigned_work");
  return <QualityControlContent email={user.email} />;
}
