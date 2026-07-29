import { requireWorkspacePermission } from "@/lib/rbac";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function SettingsPage() {
  const { user } = await requireWorkspacePermission("/workspace/settings", "manage_workspace");
  return <SettingsContent email={user.email} />;
}
