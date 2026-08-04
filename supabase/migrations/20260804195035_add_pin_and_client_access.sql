create schema if not exists private;

alter table public.profiles
  add column username text;

create unique index profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-zA-Z0-9._-]{3,32}$');

create table public.user_client_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  role public.user_role not null default 'viewer',
  is_active boolean not null default true,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, client_id)
);

comment on table public.user_client_access is
  'Associa cada utilizador apenas aos clientes que pode consultar ou gerir.';

create table private.user_pin_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin_hash text not null,
  failed_attempts smallint not null default 0 check (failed_attempts between 0 and 20),
  locked_until timestamptz,
  pin_changed_at timestamptz not null default now(),
  last_successful_login_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table private.user_pin_credentials is
  'Credenciais PIN privadas. Nunca expor pela Data API nem guardar PIN em texto simples.';

create table private.pin_login_audit (
  id bigint generated always as identity primary key,
  username_attempted text not null,
  user_id uuid references auth.users(id) on delete set null,
  was_successful boolean not null,
  failure_code text,
  attempted_at timestamptz not null default now()
);

create or replace function private.has_client_access(target_client_id uuid, allowed_roles public.user_role[] default array['admin','analyst','viewer']::public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.user_client_access access
    where access.user_id = (select auth.uid())
      and access.client_id = target_client_id
      and access.is_active
      and access.role = any(allowed_roles)
  );
$$;

revoke all on function private.has_client_access(uuid, public.user_role[]) from public;
grant execute on function private.has_client_access(uuid, public.user_role[]) to authenticated;

alter table public.user_client_access enable row level security;
create policy "users read own client access"
  on public.user_client_access for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "authenticated read clients" on public.clients;
drop policy if exists "authenticated read equipment" on public.equipment;
drop policy if exists "authenticated read imports" on public.report_imports;
drop policy if exists "authenticated read metrics" on public.equipment_monthly_metrics;
drop policy if exists "authenticated read errors" on public.import_row_errors;
drop policy if exists "authenticated read audit" on public.import_audit_log;
drop policy if exists "operators create imports" on public.report_imports;
drop policy if exists "operators insert equipment" on public.equipment;
drop policy if exists "operators insert metrics" on public.equipment_monthly_metrics;
drop policy if exists "operators insert errors" on public.import_row_errors;
drop policy if exists "operators insert audit" on public.import_audit_log;

create policy "members read assigned clients" on public.clients for select to authenticated
  using ((select private.has_client_access(id)));
create policy "members read client equipment" on public.equipment for select to authenticated
  using ((select private.has_client_access(client_id)));
create policy "members read client imports" on public.report_imports for select to authenticated
  using ((select private.has_client_access(client_id)));
create policy "members read client metrics" on public.equipment_monthly_metrics for select to authenticated
  using ((select private.has_client_access(client_id)));
create policy "members read client errors" on public.import_row_errors for select to authenticated
  using (exists (select 1 from public.report_imports import where import.id = report_import_id and (select private.has_client_access(import.client_id))));
create policy "members read client audit" on public.import_audit_log for select to authenticated
  using (exists (select 1 from public.report_imports import where import.id = report_import_id and (select private.has_client_access(import.client_id))));

create policy "operators create client imports" on public.report_imports for insert to authenticated
  with check (imported_by = (select auth.uid()) and (select private.has_client_access(client_id, array['admin','analyst']::public.user_role[])));
create policy "operators insert client equipment" on public.equipment for insert to authenticated
  with check ((select private.has_client_access(client_id, array['admin','analyst']::public.user_role[])));
create policy "operators insert client metrics" on public.equipment_monthly_metrics for insert to authenticated
  with check ((select private.has_client_access(client_id, array['admin','analyst']::public.user_role[])));
create policy "operators insert client errors" on public.import_row_errors for insert to authenticated
  with check (exists (select 1 from public.report_imports import where import.id = report_import_id and (select private.has_client_access(import.client_id, array['admin','analyst']::public.user_role[]))));
create policy "operators insert client audit" on public.import_audit_log for insert to authenticated
  with check (actor_id = (select auth.uid()) and exists (select 1 from public.report_imports import where import.id = report_import_id and (select private.has_client_access(import.client_id, array['admin','analyst']::public.user_role[]))));

grant select on public.user_client_access to authenticated;

create or replace function public.pin_login_status(candidate_username text)
returns table (user_id uuid, is_locked boolean)
language sql
security definer
set search_path = ''
as $$
  select profile.id, coalesce(credential.locked_until > now(), false)
  from public.profiles profile
  left join private.user_pin_credentials credential on credential.user_id = profile.id
  where lower(profile.username) = lower(candidate_username)
  limit 1;
$$;

create or replace function public.record_pin_login_attempt(candidate_username text, succeeded boolean, failure text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target_user_id uuid;
begin
  select id into target_user_id from public.profiles where lower(username) = lower(candidate_username) limit 1;
  insert into private.pin_login_audit(username_attempted, user_id, was_successful, failure_code)
  values (lower(candidate_username), target_user_id, succeeded, failure);
  if target_user_id is null then return; end if;
  if succeeded then
    update private.user_pin_credentials set failed_attempts = 0, locked_until = null, last_successful_login_at = now(), updated_at = now() where user_id = target_user_id;
  else
    update private.user_pin_credentials
      set failed_attempts = least(failed_attempts + 1, 20),
          locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end,
          updated_at = now()
      where user_id = target_user_id;
  end if;
end;
$$;

revoke all on function public.pin_login_status(text) from public, anon, authenticated;
revoke all on function public.record_pin_login_attempt(text, boolean, text) from public, anon, authenticated;
grant execute on function public.pin_login_status(text), public.record_pin_login_attempt(text, boolean, text) to service_role;
