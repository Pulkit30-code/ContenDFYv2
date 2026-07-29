import type { ReactNode } from "react";
import { WelcomeAnimation } from "@/components/common/welcome-animation";
import { requireWorkspacePermission } from "@/lib/rbac";

/** Every workspace route requires an active database membership. */
export default async function WorkspaceLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireWorkspacePermission("/workspace", "view_profile");
  return <><WelcomeAnimation />{children}</>;
}
