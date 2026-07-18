-- ============================================================================
-- 003 — admin allowlist + auto-provisioning
--
-- Only emails listed here can request a sign-in link, and they become admins
-- automatically on first sign-in. Solves the chicken-and-egg problem: profiles
-- references auth.users, so the first admin can't be flagged before they exist.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.admin_allowlist (
  email     text primary key,
  note      text,
  added_at  timestamptz not null default now()
);

-- Locked down: RLS on with no policies at all, so neither anon nor a signed-in
-- user can read the list. Only the service role (server-side) touches it.
alter table public.admin_allowlist enable row level security;

-- REQUIRED: this project has "Automatically expose new tables" disabled, so a
-- new table is invisible to the Data API until granted. service_role bypasses
-- RLS but still needs the GRANT. Never grant anon/authenticated here.
grant select on public.admin_allowlist to service_role;

-- ---------------------------------------------------------------- seed
insert into public.admin_allowlist (email, note)
values ('mailmofixit@gmail.com', 'FunnelVista — initial admin')
on conflict (email) do nothing;

-- ------------------------------------------------- auto-provision profiles
-- Fires when Supabase creates the auth user (i.e. first successful sign-in).
-- Grants admin only if the email is on the allowlist. Existing admin status is
-- never downgraded by this — removing someone is a deliberate manual act.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_admin)
  values (
    new.id,
    new.email,
    exists (
      select 1 from public.admin_allowlist a
      where lower(a.email) = lower(new.email)
    )
  )
  on conflict (id) do update
    set email    = excluded.email,
        is_admin = public.profiles.is_admin or excluded.is_admin;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- backfill
-- Catches anyone who already signed in before this migration ran.
insert into public.profiles (id, email, is_admin)
select u.id, u.email,
       exists (select 1 from public.admin_allowlist a where lower(a.email) = lower(u.email))
from auth.users u
on conflict (id) do update
  set is_admin = public.profiles.is_admin or excluded.is_admin;

-- ---------------------------------------------------------------- verify
select 'allowlisted emails' as check, string_agg(email, ', ') as result
from public.admin_allowlist
union all
select 'admins provisioned',
       coalesce(string_agg(email, ', '), 'none yet — sign in once to create')
from public.profiles where is_admin;

-- ============================================================================
-- To add another admin later:
--   insert into public.admin_allowlist (email, note)
--   values ('someone@futurestarsfoundation.com', 'FSF staff')
--   on conflict (email) do nothing;
--
-- To revoke:
--   delete from public.admin_allowlist where email = 'someone@…';
--   update public.profiles set is_admin = false where lower(email) = 'someone@…';
--   (both — the allowlist stops new logins, the profile flag stops the current one)
-- ============================================================================
