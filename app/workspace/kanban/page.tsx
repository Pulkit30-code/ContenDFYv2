import { requireWorkspacePermission } from "@/lib/rbac";
import { KanbanContent } from "@/components/kanban/kanban-content";

export default async function KanbanPage() {
  const { user } = await requireWorkspacePermission("/workspace/kanban", "view_assigned_work");
  return <KanbanContent email={user.email} />;
}
