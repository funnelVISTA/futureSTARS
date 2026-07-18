-- ============================================================================
-- 004 — grant service_role access to admin_allowlist
--
-- The project has "Automatically expose new tables" DISABLED (deliberately —
-- a new table stays private until opted in). So EVERY new table needs an
-- explicit grant, or the Data API can't see it at all.
--
-- 003 created admin_allowlist without one, so /api/admin-check returned 500 for
-- every address. It failed closed, which is the right failure mode, but it made
-- sign-in impossible.
--
-- service_role bypasses RLS but still needs the table-level GRANT.
-- No grant to anon or authenticated: the allowlist must never reach a browser.
-- ============================================================================

grant select on public.admin_allowlist to service_role;

-- Verify: expect exactly one row, service_role / SELECT.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'admin_allowlist'
order by grantee, privilege_type;
