import { requireWorkspacePermission } from "@/lib/rbac";
import { ProjectsContent } from "@/components/projects/projects-content";

export default async function ProjectsPage() {
  const { user } = await requireWorkspacePermission("/workspace/projects", "manage_projects");
  return <ProjectsContent email={user.email} />;
}
