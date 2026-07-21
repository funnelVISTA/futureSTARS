-- ============================================================================
-- 005 — add admin@funnelvista.com to the allowlist
--
-- Allowlisted addresses can request a sign-in link and are auto-provisioned as
-- admins on first sign-in (see 003's handle_new_user trigger).
--
-- The backfill at the end covers the case where this address has already been
-- through auth — the trigger only fires on user creation, so an existing user
-- would otherwise stay non-admin.
--
-- Safe to re-run.
-- ============================================================================

insert into public.admin_allowlist (email, note)
values ('admin@funnelvista.com', 'FunnelVista — admin')
on conflict (email) do nothing;

-- Promote if the account already exists (trigger only fires on insert).
update public.profiles
   set is_admin = true
 where lower(email) = 'admin@funnelvista.com';

-- ---------------------------------------------------------------- verify
select 'allowlisted emails' as check, string_agg(email, ', ' order by email) as result
from public.admin_allowlist
union all
select 'admins provisioned',
       coalesce(string_agg(email, ', ' order by email), 'none yet — sign in once to create')
from public.profiles where is_admin;
