import { createServerClient } from "@/supabase/server";

export type WorkspaceRole = "owner" | "admin" | "editor" | "reviewer";

/**
 * Authoritative role assignment comes from the database layer added after auth.
 * Never rely on user metadata for authorization: it is editable by the user.
 */
export const workspaceRoles: readonly WorkspaceRole[] = ["owner", "admin", "editor", "reviewer"];

export class SessionExpiredError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError;
}

export type AuthenticatedServerContext = {
  user: { id: string; email: string | null };
  supabase: Awaited<ReturnType<typeof createServerClient>>;
};

export async function requireAuthenticatedServerContext(route: string, workspaceId?: string | null): Promise<AuthenticatedServerContext> {
  void route;
  void workspaceId;
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    throw new SessionExpiredError();
  }

  const user = {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
  return { user, supabase };
}

export async function getCurrentUser(route = "server component", workspaceId?: string | null) {
  try {
    return (await requireAuthenticatedServerContext(route, workspaceId)).user;
  } catch (error) {
    if (isSessionExpiredError(error)) return null;
    throw error;
  }
}

export async function requireUser(route = "server action", workspaceId?: string | null) {
  return (await requireAuthenticatedServerContext(route, workspaceId)).user;
}
