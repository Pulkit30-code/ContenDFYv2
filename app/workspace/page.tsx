import { unauthorized } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function WorkspacePage() {
  const user = await getCurrentUser();
  if (!user) unauthorized();
  return <DashboardContent email={user.email} />;
}
