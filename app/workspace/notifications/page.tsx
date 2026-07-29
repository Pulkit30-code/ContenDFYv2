import { requireWorkspacePermission } from "@/lib/rbac";
import { NotificationsContent } from "@/components/notifications/notifications-content";

export default async function NotificationsPage() {
  const { user } = await requireWorkspacePermission("/workspace/notifications", "view_notifications");
  return <NotificationsContent email={user.email} />;
}
