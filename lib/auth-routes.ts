export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"] as const;
export const DEFAULT_AUTHENTICATED_ROUTE = "/workspace";

/** Prevent callback and login redirects from becoming open redirects. */
export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return DEFAULT_AUTHENTICATED_ROUTE;
  return value;
}
