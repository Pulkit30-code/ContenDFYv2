# ContenDFY v2

ContenDFY v2 is a Next.js content-operations workspace backed by Supabase.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill the Supabase variables using the project dashboard.
3. Install dependencies with `npm install`.
4. Start the application with `npm run dev`.

Never commit `.env.local`, and never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Required production environment variables

| Variable | Scope | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser | Yes |
| `NEXT_PUBLIC_SITE_URL` | Browser/server redirects | Yes |
| `SUPABASE_URL` | Server | Yes |
| `SUPABASE_ANON_KEY` | Server | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes |
| `SLACK_CLIENT_ID` | Server | Only when Slack is enabled |
| `SLACK_CLIENT_SECRET` | Server | Only when Slack is enabled |
| `SLACK_TOKEN_ENCRYPTION_KEY` | Server | Only when Slack is enabled |
| `SLACK_QUEUE_POLL_INTERVAL_MS` | Server | Only when Slack is enabled |

`NEXT_PUBLIC_SITE_URL` must be the exact HTTPS production origin, without a trailing path. Supabase Auth redirect URLs must include:

- `https://your-domain.example/auth/callback`
- `https://your-domain.example/reset-password`
- `https://your-domain.example/auth/create-password`

For local development, use `http://localhost:3000` equivalents.

## Security and deployment

- Configure the same required variables for Preview and Production deployments; use the correct `NEXT_PUBLIC_SITE_URL` for each environment.
- Apply the versioned SQL in `supabase/migrations/` to the target Supabase project before deployment.
- Configure custom SMTP (or a Send Email Auth Hook) in Supabase Auth before inviting external teammates. Supabase's default mail provider only delivers Auth emails to organization members, so it cannot deliver production invitations to customer or teammate inboxes.
- In Supabase Auth, set the Site URL to the production origin and add that origin's `/auth/create-password`, `/auth/callback`, and `/reset-password` paths to Redirect URLs. The invite email template must retain `{{ .ConfirmationURL }}`.
- The application adds a nonce-based Content Security Policy, HSTS in production, a restrictive Permissions Policy, and standard anti-sniffing/frame headers.
- Keep the Supabase service-role key server-only. The Supabase URL and anon key are intentionally public and protected by RLS.
- Confirm Supabase Auth compromised-password protection is enabled in the Auth security dashboard before production release.

## Verification

Run the release checks before deployment:

```bash
npm run build
npx tsc --noEmit
npm run lint
npm audit --omit=dev
```

## Project structure

- `app/`: App Router pages, route handlers, and error boundaries
- `components/`: workspace UI, loading states, empty states, and shared providers
- `lib/`: validation, permissions, and authentication helpers
- `services/`: data and file-upload boundaries
- `supabase/`: Supabase clients, session middleware, and versioned migrations
