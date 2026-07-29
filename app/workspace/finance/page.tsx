import { requireWorkspacePermission } from "@/lib/rbac";
import { FinanceContent } from "@/components/finance/finance-content";

export default async function FinancePage() {
  const { user } = await requireWorkspacePermission("/workspace/finance", "view_finance");
  return <FinanceContent email={user.email} />;
}
