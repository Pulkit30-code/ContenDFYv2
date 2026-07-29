# Production QA Report

**Date:** 2026-07-28  
**Status:** Not approved for production deployment

## Verified

- `npm run build` completed successfully with Next.js production output.
- `npx tsc --noEmit` completed successfully.
- ESLint completed with no errors.
- All tested unauthenticated workspace URLs return a `307` redirect to `/login`, retain the requested destination in `next`, and include `reason=session-expired`:
  - `/workspace`, `/workspace/projects`, `/workspace/assignments`, `/workspace/kanban`, `/workspace/files`, `/workspace/notifications`, `/workspace/profile`, `/workspace/team`, `/workspace/calendar`, `/workspace/settings`, `/workspace/finance`, and `/workspace/quality-control`.
- The custom 404 page returns HTTP `404` and renders the branded Page Not Found experience.
- The response has `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin` headers.
- Static code review confirms `safeNextPath` rejects open redirects and the auth callback uses it.
- Static code review confirms server-side route guards use database workspace memberships and role permissions, rather than user-editable metadata.
- Type and size validation is now enforced before file upload. Supported formats match the formats advertised in the UI and files over 2 GB are rejected before transfer.

## Fixed during this audit

- **File upload validation:** the UI advertised type and 2 GB limits but the uploader did not enforce them. Uploads now reject unsupported formats and files larger than 2 GB before they are queued.

## Release blockers

The following cannot be claimed as tested in this workspace because no QA identities, mailbox access, or isolated test workspace were provided. They require authenticated, role-specific browser tests and must be completed before approval:

1. Registration, email confirmation, login, logout, reset-password links, session refresh/expiry, and duplicate-account behaviour.
2. Create/edit/delete/archive/restore workflows for projects and assignments, including notification delivery and real-time updates.
3. File upload/download/preview/rename/delete/retry with actual storage, including storage-bucket size limits and failure recovery.
4. Notifications, profile/settings persistence, integrations, and theme persistence after refresh.
5. Role-by-role access checks for Owner, Project Manager, Editor, and Client, including manual deep-link attempts.
6. Responsive and keyboard/screen-reader checks on authenticated pages.
7. Database Row Level Security and storage-bucket policies. The application performs client-side CRUD; production data isolation therefore depends on Supabase policies, which are not present in this repository and cannot be verified locally.

## Warnings

- ESLint reports six pre-existing unused-code warnings in assignment and projects components. They do not prevent the build but should be removed before the next release.
- File progress is presentation progress; the storage SDK call does not expose byte-level upload progress.
- Files are currently stored with public storage URLs. Confirm the `files` bucket is intentionally public; otherwise switch to signed URLs and enforce private bucket policies before deployment.
- Browser automation was not available in this environment, so no visual, device, console, or authenticated interaction evidence was produced.

## Deployment decision

**Do not deploy yet.** The build and unauthenticated access controls pass, and the upload-validation defect is fixed. Deployment approval depends on completing the release-blocker matrix above against a disposable owner, project-manager, editor, and client test account, plus confirming Supabase RLS and storage policies.
