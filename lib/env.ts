import { z } from "zod";

const publicEnvSchema = z.object({ NEXT_PUBLIC_SUPABASE_URL: z.url(), NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1), NEXT_PUBLIC_SITE_URL: z.url() });
const serverEnvSchema = z.object({ SUPABASE_URL: z.url(), SUPABASE_ANON_KEY: z.string().min(1), SUPABASE_SERVICE_ROLE_KEY: z.string().min(1) });
const slackEnvSchema = z.object({
  SLACK_CLIENT_ID: z.string().min(1),
  SLACK_CLIENT_SECRET: z.string().min(1),
  SLACK_TOKEN_ENCRYPTION_KEY: z.string().regex(/^(?:[a-fA-F0-9]{64}|[A-Za-z0-9_-]{43})$/, "must be a 32-byte hex or base64url key"),
  SLACK_QUEUE_POLL_INTERVAL_MS: z.coerce.number().int().positive(),
});

function parseOrThrow<T>(schema: z.ZodType<T>, values: unknown, scope: string): T {
  const result = schema.safeParse(values);
  if (!result.success) throw new Error(`Invalid ${scope} environment variables: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  return result.data;
}

/** Values intentionally safe to ship to the browser. */
export function getPublicEnv() { return parseOrThrow(publicEnvSchema, { NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL }, "public"); }
/** Server-only credentials. Never add a service role key to public env. */
export function getServerEnv() { return parseOrThrow(serverEnvSchema, { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY }, "server"); }
export function getPublicSiteUrl() { return new URL(getPublicEnv().NEXT_PUBLIC_SITE_URL).origin; }
/** Single canonical origin for browser and server authentication redirects. */
export function getAppUrl() { return getPublicSiteUrl(); }
/** Server-only Slack credentials. Never call this from a client component. */
export function getSlackEnv() {
  return parseOrThrow(slackEnvSchema, {
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
    SLACK_TOKEN_ENCRYPTION_KEY: process.env.SLACK_TOKEN_ENCRYPTION_KEY,
    SLACK_QUEUE_POLL_INTERVAL_MS: process.env.SLACK_QUEUE_POLL_INTERVAL_MS,
  }, "Slack");
}

export function getSlackRedirectUrl() { return new URL("/api/slack/oauth/callback", getAppUrl()).toString(); }
