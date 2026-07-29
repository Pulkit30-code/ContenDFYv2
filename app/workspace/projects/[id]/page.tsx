import { requireWorkspacePermission } from "@/lib/rbac";
import { ProjectDetailsContent } from "@/components/projects/projects-content";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireWorkspacePermission(`/workspace/projects/${id}`, "manage_projects");
  return <ProjectDetailsContent email={user.email} id={id} />;
}
