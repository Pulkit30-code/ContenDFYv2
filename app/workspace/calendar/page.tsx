import { requireWorkspacePermission } from "@/lib/rbac";
import { CalendarContent } from "@/components/calendar/calendar-content";

export default async function CalendarPage() {
  const { user } = await requireWorkspacePermission("/workspace/calendar", "view_assigned_work");
  return <CalendarContent email={user.email} />;
}
