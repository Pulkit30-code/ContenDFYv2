import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/auth-routes";

export async function GET(request: NextRequest) {
  const url = new URL(request.url); const code = url.searchParams.get("code"); const next = safeNextPath(url.searchParams.get("next"));
  // The callback must return to the deployment that received the auth request.
  // This avoids redirect failures when a deployment does not define a separate
  // canonical site URL.
  const redirectOrigin = url.origin;
  const response = NextResponse.redirect(new URL(next, redirectOrigin));
  const env = getServerEnv();
  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  if (code) { const { error } = await supabase.auth.exchangeCodeForSession(code); if (!error) return response; }
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Your sign-in link is invalid or has expired.")}`, redirectOrigin));
}
