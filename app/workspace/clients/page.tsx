import { requireWorkspacePermission } from "@/lib/rbac";
import { ClientsContent } from "@/components/clients/clients-content";

export default async function ClientsPage() {
  const { user } = await requireWorkspacePermission("/workspace/clients", "view_clients");
  return <ClientsContent email={user.email} />;
}
