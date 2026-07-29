alter table public.assignments
  drop constraint if exists assignments_deliverables_check,
  add constraint assignments_deliverables_check check (deliverables between 1 and 999),
  drop constraint if exists assignments_number_of_deliverables_check,
  add constraint assignments_number_of_deliverables_check check (number_of_deliverables between 1 and 999);

alter table public.projects
  drop constraint if exists projects_deliverables_check,
  add constraint projects_deliverables_check check (deliverables between 1 and 999),
  drop constraint if exists projects_number_of_deliverables_check,
  add constraint projects_number_of_deliverables_check check (number_of_deliverables between 1 and 999);

create or replace function public.prevent_duplicate_workspace_clients()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      coalesce(new.workspace_id::text, '') || ':' || pg_catalog.lower(new.name),
      0
    )
  );

  if exists (
    select 1
    from public.clients existing
    where existing.workspace_id is not distinct from new.workspace_id
      and pg_catalog.lower(pg_catalog.btrim(existing.name)) = pg_catalog.lower(new.name)
      and existing.id is distinct from new.id
  ) then
    raise unique_violation using message = 'A client with this name already exists in the workspace.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_duplicate_workspace_clients on public.clients;
create trigger prevent_duplicate_workspace_clients
before insert or update of name, workspace_id on public.clients
for each row execute function public.prevent_duplicate_workspace_clients();

revoke all on function public.prevent_duplicate_workspace_clients() from public, anon, authenticated;
