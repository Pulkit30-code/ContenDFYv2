import { requireWorkspacePermission } from "@/lib/rbac";
import { TeamContent } from "@/components/team/team-content";

export default async function TeamPage() {
  const { user } = await requireWorkspacePermission("/workspace/team", "manage_team");
  return <TeamContent email={user.email} />;
}
