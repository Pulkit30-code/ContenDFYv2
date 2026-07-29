-- New Data API exposure defaults do not grant table privileges to service_role.
-- The activation route only needs to read invitation state; all writes remain
-- inside the tightly scoped activation function.
grant select on table public.workspace_invitations to service_role;
