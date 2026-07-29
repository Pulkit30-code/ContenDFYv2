import { ProfileContent } from "@/components/profile/profile-content";
import { requireWorkspacePermission } from "@/lib/rbac";

export default async function ProfilePage() {
  const { user } = await requireWorkspacePermission("/workspace/profile", "view_profile");
  return <ProfileContent email={user.email} />;
}
