-- Profile activation can synchronize team_members before the explicit
-- team_members update below. Establish the trusted invitation context first so
-- every activation-side write is authorized by the privilege guard.
create or replace function public.activate_workspace_invitation(
  invitation_id uuid,
  activating_user uuid
)
returns public.workspace_memberships
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  invitation public.workspace_invitations;
  membership public.workspace_memberships;
  activating_email text;
  activation_pending boolean;
begin
  select email, coalesce((raw_app_meta_data ->> 'invitation_activation_pending')::boolean, false)
  into activating_email, activation_pending
  from auth.users
  where id = activating_user;

  if activating_email is null then
    raise exception 'The authenticated account could not be verified.';
  end if;

  select * into invitation
  from public.workspace_invitations
  where id = invitation_id
  for update;

  if not found
    or invitation.activated_at is not null
    or invitation.revoked_at is not null
    or invitation.status not in ('pending', 'accepted')
    or not activation_pending
  then
    raise exception 'This invitation is invalid or has already been activated.';
  end if;

  if invitation.expires_at <= now() then
    update public.workspace_invitations
    set status = 'expired'
    where id = invitation.id;
    raise exception 'This invitation has expired.';
  end if;

  if lower(invitation.email) <> lower(activating_email) then
    raise exception 'This invitation belongs to a different email address.';
  end if;

  perform set_config('app.invitation_activation_id', invitation.id::text, true);

  update public.workspace_invitations
  set accepted_at = now(),
      activated_at = now(),
      accepted_by = activating_user,
      status = 'accepted'
  where id = invitation.id;

  insert into public.workspace_memberships (workspace_id, user_id, role, is_active)
  values (invitation.workspace_id, activating_user, invitation.role, true)
  on conflict (workspace_id, user_id)
  do update set role = excluded.role, is_active = true
  returning * into membership;

  update public.profiles
  set workspace_id = invitation.workspace_id,
      is_active = true
  where id = activating_user;

  update public.team_members
  set user_id = activating_user,
      invitation_status = 'accepted',
      accepted_at = now(),
      joined_at = coalesce(joined_at, now()),
      is_active = true
  where workspace_id = invitation.workspace_id
    and lower(email) = lower(invitation.email);

  update public.team_invitations
  set status = 'accepted',
      accepted_by = activating_user,
      accepted_at = now(),
      updated_at = now()
  where workspace_id = invitation.workspace_id
    and lower(email) = lower(invitation.email)
    and status = 'pending';

  return membership;
end;
$$;

revoke all on function public.activate_workspace_invitation(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.activate_workspace_invitation(uuid, uuid)
to service_role;
