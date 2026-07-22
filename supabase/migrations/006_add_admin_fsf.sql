-- ============================================================================
-- 006 — add info@futurestarsfoundation.com to the allowlist
--
-- FSF's own staff address. Allowlisted addresses can request a sign-in link and
-- are auto-provisioned as admins on first sign-in (see 003's trigger).
--
-- The backfill covers the case where the account already exists — the trigger
-- only fires on user creation.
--
-- Safe to re-run.
-- ============================================================================

insert into public.admin_allowlist (email, note)
values ('info@futurestarsfoundation.com', 'FSF — staff')
on conflict (email) do nothing;

-- Promote if the account already exists (trigger only fires on insert).
update public.profiles
   set is_admin = true
 where lower(email) = 'info@futurestarsfoundation.com';

-- ---------------------------------------------------------------- verify
select 'allowlisted emails' as check, string_agg(email, ', ' order by email) as result
from public.admin_allowlist
union all
select 'admins provisioned',
       coalesce(string_agg(email, ', ' order by email), 'none yet — sign in once to create')
from public.profiles where is_admin;
