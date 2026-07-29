import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createServerClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();
  return createSupabaseServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { cookies: { getAll: () => cookieStore.getAll(), setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot mutate cookies; proxy.ts refreshes sessions. */ } } } });
}

let adminClient: ReturnType<typeof createSupabaseServerClient<Database>> | null = null;

/** Uses the service role only in server route handlers; never import this from client code. */
export function createAdminClient() {
  if (!adminClient) {
    const env = getServerEnv();
    adminClient = createSupabaseServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { cookies: { getAll: () => [], setAll: () => undefined } });
  }
  return adminClient;
}
