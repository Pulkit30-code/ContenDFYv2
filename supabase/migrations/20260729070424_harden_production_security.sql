-- Production security hardening. This migration narrows exposed database
-- surface area without granting new client access.

create schema if not exists private;

-- Keep the existing private RBAC helper as the sole workspace-role function.
alter policy assignments_manage on public.project_assignments
  using (private.has_workspace_role(workspace_id, array['owner'::public.workspace_role, 'project_manager'::public.workspace_role]))
  with check (private.has_workspace_role(workspace_id, array['owner'::public.workspace_role, 'project_manager'::public.workspace_role]));

alter policy assignments_read on public.project_assignments
  using ((user_id = auth.uid()) or private.has_workspace_role(workspace_id, array['owner'::public.workspace_role, 'project_manager'::public.workspace_role]));

alter policy memberships_read on public.workspace_memberships
  using ((user_id = auth.uid()) or private.has_workspace_role(workspace_id, array['owner'::public.workspace_role, 'project_manager'::public.workspace_role]));

drop function if exists public.has_workspace_role(uuid, public.workspace_role[]);

-- The following legacy helpers are used internally by RLS policies and
-- triggers. Moving them out of the exposed API schema prevents direct RPC
-- invocation while preserving their existing database dependencies.
alter function public.accept_workspace_invitation(uuid) set schema private;
alter function public.is_project_assigned(uuid) set schema private;
alter function public.is_team_member_visible(uuid, uuid, text) set schema private;
alter function public.is_team_owner_or_manager(uuid) set schema private;
alter function public.is_workspace_archived(uuid) set schema private;
alter function public.is_workspace_manager(uuid) set schema private;
alter function public.is_workspace_member(uuid) set schema private;
alter function public.prevent_team_member_privilege_escalation() set schema private;
alter function public.rls_auto_enable() set schema private;
alter function public.set_assignments_owner_id() set schema private;
alter function public.set_clients_owner_id() set schema private;
alter function public.set_owner_id_from_auth() set schema private;

-- Rebind internal calls after moving the helpers and explicitly pin their
-- resolution path. These remain SECURITY DEFINER because RLS policy helpers
-- must safely read membership records without recursive policy evaluation.
create or replace function private.is_workspace_member(target_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_memberships
    where workspace_id = target_owner
      and user_id = auth.uid()
      and is_active
  );
$$;

create or replace function private.is_workspace_archived(target_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select coalesce((
    select p.is_deleted = true or p.status = 'archived'
    from public.profiles p
    where p.id = target_owner
  ), false);
$$;

create or replace function private.is_workspace_manager(target_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select not private.is_workspace_archived(target_owner)
    and (
      auth.uid() = target_owner
      or exists (
        select 1
        from public.team_members tm
        where tm.owner_id = target_owner
          and tm.user_id = auth.uid()
          and tm.is_active = true
          and tm.invitation_status = 'accepted'
          and tm.team_role in ('Owner', 'Manager')
      )
    );
$$;

create or replace function private.is_team_owner_or_manager(target_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$ select private.is_workspace_manager(target_owner); $$;

create or replace function private.is_team_member_visible(target_owner uuid, target_user uuid, target_email text)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select private.is_workspace_member(target_owner)
    or target_user = auth.uid()
    or lower(coalesce(target_email, '')) = lower(coalesce(public.current_user_email(), ''));
$$;

create or replace function private.prevent_team_member_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if private.is_team_owner_or_manager(old.owner_id) then
    return new;
  end if;

  if new.owner_id is distinct from old.owner_id
    or new.user_id is distinct from old.user_id
    or new.team_role is distinct from old.team_role
    or new.invitation_status is distinct from old.invitation_status
    or new.is_active is distinct from old.is_active
  then
    raise exception 'Only owners and managers can change team access fields.';
  end if;

  return new;
end;
$$;

-- Internal policy helpers need execute permission for authenticated RLS
-- evaluation, but must never be invocable by anonymous callers.
revoke all on function private.accept_workspace_invitation(uuid) from public, anon;
revoke all on function private.is_project_assigned(uuid) from public, anon;
revoke all on function private.is_team_member_visible(uuid, uuid, text) from public, anon;
revoke all on function private.is_team_owner_or_manager(uuid) from public, anon;
revoke all on function private.is_workspace_archived(uuid) from public, anon;
revoke all on function private.is_workspace_manager(uuid) from public, anon;
revoke all on function private.is_workspace_member(uuid) from public, anon;
revoke all on function private.prevent_team_member_privilege_escalation() from public, anon;
revoke all on function private.rls_auto_enable() from public, anon;
revoke all on function private.set_assignments_owner_id() from public, anon;
revoke all on function private.set_clients_owner_id() from public, anon;
revoke all on function private.set_owner_id_from_auth() from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.is_project_assigned(uuid) to authenticated;
grant execute on function private.is_team_member_visible(uuid, uuid, text) to authenticated;
grant execute on function private.is_team_owner_or_manager(uuid) to authenticated;
grant execute on function private.is_workspace_archived(uuid) to authenticated;
grant execute on function private.is_workspace_manager(uuid) to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;

-- Pin trigger function search paths to eliminate mutable-path findings.
alter function public.set_updated_at() set search_path = pg_catalog;
alter function public.files_set_updated_at() set search_path = pg_catalog;
alter function public.workspace_settings_set_updated_at() set search_path = pg_catalog;

-- These feature tables are intentionally server/admin-only. Explicit
-- deny-by-default policies preserve the current no-client-access behavior and
-- prevent accidental Data API exposure.
create policy "server only access" on public.deliverables as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_approval_history as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_assets as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_folders as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_integrations as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_project_cache as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_project_mappings as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_review_comments as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_reviews as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_revisions as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_webhook_events as restrictive for all to authenticated using (false) with check (false);
create policy "server only access" on public.frameio_webhooks as restrictive for all to authenticated using (false) with check (false);

-- Public bucket URLs remain readable, but listing all avatar object names is
-- not needed and exposes more metadata than intended.
drop policy if exists team_avatars_public_read on storage.objects;
