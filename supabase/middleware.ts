import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

function createContentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https://*.supabase.co",
    "media-src 'self' blob: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse, contentSecurityPolicy: string) {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  response.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=(), usb=()");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  if (process.env.NODE_ENV === "production") response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

export async function updateSession(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  const requestWithSecurityHeaders = new NextRequest(request, { headers: requestHeaders });
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const env = getServerEnv();
  const remember = request.cookies.get("contendfy-remember")?.value !== "false";
  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    // A session-only preference deliberately omits Max-Age on refreshed auth cookies.
    cookieOptions: remember ? undefined : { maxAge: undefined },
    cookies: { getAll: () => requestWithSecurityHeaders.cookies.getAll(), setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value }) => requestWithSecurityHeaders.cookies.set(name, value)); response = NextResponse.next({ request: { headers: requestHeaders } }); cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } },
  });
  // `getClaims` verifies the access token. Keep this immediately after client
  // creation so refresh cookies are reliably propagated to the response.
  const { data } = await supabase.auth.getClaims();

  if (request.nextUrl.pathname.startsWith("/workspace") && !data?.claims?.sub) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    loginUrl.searchParams.set("reason", "session-expired");
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return applySecurityHeaders(redirectResponse, contentSecurityPolicy);
  }
  return applySecurityHeaders(response, contentSecurityPolicy);
}
