-- ============================================================================
-- 002 — let admins update workflow fields
--
-- The initial schema granted admins SELECT only, so /admin could read but not
-- mark a message read or move a registration to "confirmed". This adds UPDATE
-- for admins only. Inserts remain server-side (service role) exclusively.
-- Safe to re-run.
-- ============================================================================

grant update on
  public.registrations, public.volunteers, public.partnerships, public.contacts
to authenticated;

do $$
declare t text;
begin
  foreach t in array array['registrations','volunteers','partnerships','contacts'] loop
    execute format('drop policy if exists "admins update %1$s" on public.%1$I;', t);
    execute format(
      'create policy "admins update %1$s" on public.%1$I
         for update using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- Confirm: expect 4 update policies + the 6 select policies from the schema.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;
