-- ============================================================================
-- 007 — first-party, cookieless analytics
--
-- Why not Plausible/GA: GA4 needs a cookie banner on a youth-facing site, and
-- Plausible is a paid dependency that can't be queried from inside /admin. This
-- keeps traffic data in the same database as everything else, so the dashboard
-- can join it to registrations and show a real conversion rate.
--
-- Privacy shape (deliberate — this is what keeps it consent-free):
--   • No cookie, no localStorage, no device ID.
--   • The raw IP is NEVER stored. /api/track hashes ip + user-agent + a salt
--     that rotates at midnight, and keeps only the digest. Once the day turns
--     the old digests can't be linked to a person or to the next day's visits.
--   • Consequence to know when reading the numbers: a returning visitor counts
--     once PER DAY. Multi-day "visitors" is therefore visits-by-day, not people.
--     That is the honest trade for not tracking anyone across days.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.pageviews (
  id            bigserial primary key,
  seen_at       timestamptz not null default now(),
  path          text not null,
  referrer_host text,
  utm_source    text,
  device        text,          -- mobile | tablet | desktop
  country       text,          -- 2-letter, from the CDN edge; no city, no IP
  visitor_hash  text not null
);

-- Every aggregate below filters or groups on seen_at.
create index if not exists pageviews_seen_idx on public.pageviews (seen_at desc);
create index if not exists pageviews_path_idx on public.pageviews (path);

alter table public.pageviews enable row level security;

-- Admins read; only the service role (via /api/track) writes. Same two-gate
-- pattern as every other table — see schema.sql.
drop policy if exists "admins read pageviews" on public.pageviews;
create policy "admins read pageviews" on public.pageviews
  for select using (public.is_admin());

-- REQUIRED: "Automatically expose new tables" is disabled on this project, so
-- a new table is invisible to the Data API until granted. Missing this is what
-- broke admin_allowlist in 003 — see GO-LIVE.md gotchas.
grant select on public.pageviews to authenticated;
grant all    on public.pageviews to service_role;
grant usage, select on sequence public.pageviews_id_seq to service_role;

-- ============================================================================
-- analytics_summary(days) -> jsonb
--
-- One round trip returns every number the dashboard shows. The alternative —
-- selecting raw rows and counting in the browser — would ship the whole table
-- to the client and fall over once this grows past a few thousand rows.
--
-- SECURITY DEFINER so it can read past RLS, with an explicit is_admin() gate as
-- the actual check. Execute is granted to authenticated only; a signed-in
-- non-admin gets the exception, not data.
-- ============================================================================
create or replace function public.analytics_summary(days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  -- FSF operates in BC. Day boundaries must be local, or "today" rolls over at
  -- 4pm and the daily numbers look wrong to the person reading them.
  tz    constant text := 'America/Vancouver';
  today date;
  n     int;
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorised';
  end if;

  today := (now() at time zone tz)::date;
  n     := least(greatest(coalesce(days, 30), 7), 90);

  with v as (
    select (seen_at at time zone tz)::date as d,
           path, referrer_host, utm_source, device, country, visitor_hash
    from public.pageviews
  ),
  by_day as (
    select d, count(*) as views, count(distinct visitor_hash) as visitors
    from v group by d
  )
  select jsonb_build_object(
    'generated_at', now(),
    'tz',           tz,
    'first_seen',   (select min(seen_at) from public.pageviews),
    'days',         n,

    'totals', (select jsonb_build_object(
        'today_views',     count(*)                       filter (where d = today),
        'today_visitors',  count(distinct visitor_hash)   filter (where d = today),
        'yest_visitors',   count(distinct visitor_hash)   filter (where d = today - 1),
        'd7_views',        count(*)                       filter (where d >  today - 7),
        'd7_visitors',     count(distinct visitor_hash)   filter (where d >  today - 7),
        'prev7_visitors',  count(distinct visitor_hash)   filter (where d >  today - 14 and d <= today - 7),
        'd30_views',       count(*)                       filter (where d >  today - 30),
        'd30_visitors',    count(distinct visitor_hash)   filter (where d >  today - 30),
        'prev30_visitors', count(distinct visitor_hash)   filter (where d >  today - 60 and d <= today - 30),
        'all_views',       count(*),
        'all_visitors',    count(distinct visitor_hash)
      ) from v),

    -- Gap-filled so a quiet day plots as zero instead of being skipped, which
    -- would silently compress the x-axis and flatter the trend.
    'daily', (select coalesce(jsonb_agg(jsonb_build_object(
          'day', gs.ts::date, 'views', coalesce(b.views, 0), 'visitors', coalesce(b.visitors, 0)
        ) order by gs.ts), '[]'::jsonb)
      from generate_series((today - (n - 1))::timestamp, today::timestamp, interval '1 day') gs(ts)
      left join by_day b on b.d = gs.ts::date),

    -- jsonb_agg needs its own ORDER BY: a sorted subquery does not guarantee
    -- the order the aggregate consumes rows in.
    'top_pages', (select coalesce(jsonb_agg(
          jsonb_build_object('path', path, 'views', views, 'visitors', visitors)
          order by views desc), '[]'::jsonb)
      from (select path, count(*) as views, count(distinct visitor_hash) as visitors
            from v where d > today - n
            group by path order by count(*) desc limit 10) t),

    'referrers', (select coalesce(jsonb_agg(
          jsonb_build_object('source', source, 'visitors', visitors)
          order by visitors desc), '[]'::jsonb)
      from (select coalesce(utm_source, referrer_host, 'Direct / none') as source,
                   count(distinct visitor_hash) as visitors
            from v where d > today - n
            group by 1 order by 2 desc limit 10) t),

    'devices', (select coalesce(jsonb_agg(
          jsonb_build_object('device', device, 'visitors', visitors)
          order by visitors desc), '[]'::jsonb)
      from (select coalesce(device, 'unknown') as device,
                   count(distinct visitor_hash) as visitors
            from v where d > today - n
            group by 1) t),

    'countries', (select coalesce(jsonb_agg(
          jsonb_build_object('country', country, 'visitors', visitors)
          order by visitors desc), '[]'::jsonb)
      from (select coalesce(country, '—') as country,
                   count(distinct visitor_hash) as visitors
            from v where d > today - n
            group by 1 order by 2 desc limit 8) t),

    'best_day', (select jsonb_build_object('day', d, 'visitors', visitors)
      from by_day order by visitors desc, d desc limit 1)
  ) into result;

  return result;
end $$;

revoke all on function public.analytics_summary(int) from public, anon;
grant execute on function public.analytics_summary(int) to authenticated;

-- ---------------------------------------------------------------- verify
select 'pageviews table' as check, count(*)::text || ' rows' as result from public.pageviews
union all
select 'summary callable', case when public.is_admin()
       then 'yes — signed in as admin'
       else 'function created; SQL editor is not an admin session, so it declines here (correct)' end;
