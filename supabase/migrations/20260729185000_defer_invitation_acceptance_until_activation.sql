-- Provision the invited profile and membership at Auth user creation time, but
-- keep both inactive and leave the invitation pending until a password exists.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  provisioned_workspace_id uuid;
  provisioned_owner_id uuid;
  provisioned_name text;
  provisioned_workspace_name text;
  invited_role public.workspace_role;
begin
  if new.email is null or btrim(new.email) = '' then
    raise exception 'A verified email address is required to create a ContenDFY account.';
  end if;

  provisioned_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );

  select workspace_id, role into provisioned_workspace_id, invited_role
  from public.workspace_invitations
  where lower(email) = lower(new.email)
    and accepted_at is null
    and revoked_at is null
    and status = 'pending'
    and expires_at > now()
  order by created_at desc
  limit 1;

  if found then
    select owner_id into provisioned_owner_id
    from public.workspaces
    where id = provisioned_workspace_id;

    insert into public.profiles (
      id, email, full_name, display_name, name, role, title, team_role,
      is_active, workspace_id, owner_id, created_at, updated_at
    )
    values (
      new.id,
      new.email,
      provisioned_name,
      provisioned_name,
      provisioned_name,
      case invited_role when 'project_manager' then 'Project Manager' when 'editor' then 'Video Editor' else 'Client' end,
      case invited_role when 'project_manager' then 'Project Manager' when 'editor' then 'Video Editor' else 'Client' end,
      case invited_role when 'project_manager' then 'Manager'::public.team_role when 'editor' then 'Editor'::public.team_role else 'Client'::public.team_role end,
      false,
      provisioned_workspace_id,
      provisioned_owner_id,
      now(),
      now()
    )
    on conflict (id) do update set
      email = excluded.email,
      full_name = excluded.full_name,
      display_name = excluded.display_name,
      name = excluded.name,
      role = excluded.role,
      title = excluded.title,
      team_role = excluded.team_role,
      is_active = false,
      workspace_id = excluded.workspace_id,
      owner_id = excluded.owner_id,
      updated_at = now();

    insert into public.workspace_memberships (workspace_id, user_id, role, is_active)
    values (provisioned_workspace_id, new.id, invited_role, false)
    on conflict (workspace_id, user_id)
    do update set role = excluded.role, is_active = false;

    return new;
  end if;

  provisioned_workspace_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    provisioned_name || '''s Workspace'
  );
  insert into public.workspaces (name, owner_id)
  values (provisioned_workspace_name, new.id)
  returning id into provisioned_workspace_id;
  insert into public.profiles (
    id, email, full_name, display_name, name, role, title, team_role,
    is_active, workspace_id, owner_id, created_at, updated_at
  )
  values (
    new.id, new.email, provisioned_name, provisioned_name, provisioned_name,
    'Owner', 'Workspace Owner', 'Owner'::public.team_role, true,
    provisioned_workspace_id, new.id, now(), now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    display_name = excluded.display_name,
    name = excluded.name,
    role = excluded.role,
    title = excluded.title,
    team_role = excluded.team_role,
    is_active = true,
    workspace_id = excluded.workspace_id,
    owner_id = excluded.owner_id,
    updated_at = now();
  insert into public.workspace_memberships (workspace_id, user_id, role, is_active)
  values (provisioned_workspace_id, new.id, 'owner'::public.workspace_role, true)
  on conflict (workspace_id, user_id)
  do update set role = excluded.role, is_active = true;
  return new;
exception when others then
  raise exception 'Account provisioning failed: %', sqlerrm;
end;
$$;

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
  select email,
         coalesce((raw_app_meta_data ->> 'invitation_activation_pending')::boolean, false)
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
    update public.workspace_invitations set status = 'expired' where id = invitation.id;
    raise exception 'This invitation has expired.';
  end if;

  if lower(invitation.email) <> lower(activating_email) then
    raise exception 'This invitation belongs to a different email address.';
  end if;

  insert into public.workspace_memberships (workspace_id, user_id, role, is_active)
  values (invitation.workspace_id, activating_user, invitation.role, true)
  on conflict (workspace_id, user_id)
  do update set role = excluded.role, is_active = true
  returning * into membership;

  update public.workspace_invitations
  set accepted_at = now(),
      activated_at = now(),
      accepted_by = activating_user,
      status = 'accepted'
  where id = invitation.id;

  update public.profiles
  set workspace_id = invitation.workspace_id, is_active = true
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

revoke all on function public.activate_workspace_invitation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.activate_workspace_invitation(uuid, uuid) to service_role;
