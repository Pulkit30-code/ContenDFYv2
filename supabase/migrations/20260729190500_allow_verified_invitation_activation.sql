-- Permit only the server-verified pending -> accepted transition. All normal
-- access-field changes remain restricted to workspace owners and managers.
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

  if old.invitation_status = 'pending'
    and new.invitation_status = 'accepted'
    and new.is_active = true
    and new.owner_id is not distinct from old.owner_id
    and new.team_role is not distinct from old.team_role
    and exists (
      select 1
      from public.workspace_invitations invitation
      where invitation.workspace_id = new.workspace_id
        and lower(invitation.email) = lower(new.email)
        and invitation.status = 'accepted'
        and invitation.activated_at is not null
        and invitation.accepted_by = new.user_id
    )
  then
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

revoke all on function private.prevent_team_member_privilege_escalation() from public, anon;
