-- ============================================================================
-- Future Stars Foundation — database schema
--
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- The project MUST be in the ca-central-1 region: this stores Canadian
-- children's personal data, and the region cannot be changed after creation.
--
-- Security model
--   • RLS is ON for every table with NO anon/authenticated policies for writes.
--     Nothing can be written from a browser.
--   • All inserts go through /api/submit using the SERVICE ROLE key, which
--     bypasses RLS and lives only in Vercel env vars — never in client code.
--   • Reads are limited to signed-in users flagged is_admin in `profiles`.
-- ============================================================================

-- ---------------------------------------------------------------- extensions
create extension if not exists "pgcrypto";     -- gen_random_uuid()

-- ------------------------------------------------------------------ profiles
-- Admin allowlist. A row here does NOT grant admin; is_admin must be set true
-- manually. There is deliberately no public signup path to /admin.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------- registrations
-- One row per submission = one guardian. Children hang off `participants`.
create table if not exists public.registrations (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),

  guardian_name          text not null,
  guardian_relationship  text not null,
  guardian_email         text not null,
  guardian_phone         text not null,
  guardian_street        text not null,
  guardian_city          text not null,
  guardian_postal        text not null,

  emergency_name         text not null,
  emergency_phone        text not null,
  emergency_relationship text,

  -- consent trail: both required at submit time, stored so we can prove it
  consent_policy         boolean not null default false,
  consent_accurate       boolean not null default false,
  consent_newsletter     boolean not null default false,

  status                 text not null default 'new'
                         check (status in ('new','confirmed','waitlisted','cancelled')),
  staff_notes            text,

  -- provenance, for spam triage and CASL evidence
  source_ip              text,
  user_agent             text
);

-- ------------------------------------------------------------- participants
-- The children. Age is validated in the API, not by a CHECK constraint:
-- eligibility depends on now(), which isn't immutable in Postgres, and a
-- child legitimately ages out of range while their record must stay valid.
create table if not exists public.participants (
  id               uuid primary key default gen_random_uuid(),
  registration_id  uuid not null references public.registrations (id) on delete cascade,
  created_at       timestamptz not null default now(),

  child_name       text not null,
  child_dob        date not null,
  program          text not null,
  school           text,
  medical          text,               -- allergies / medical / accessibility
  photo_consent    boolean not null default false
);

create index if not exists participants_registration_idx on public.participants (registration_id);
create index if not exists participants_program_idx      on public.participants (program);

-- ---------------------------------------------------------------- volunteers
create table if not exists public.volunteers (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),

  name                text not null,
  dob                 date,
  email               text not null,
  phone               text not null,
  street              text,
  city                text,
  province            text,
  postal              text,
  country             text,
  emergency_contact   text,

  interests           text[],           -- areas they want to volunteer in
  availability        text[],
  why                 text,
  skills              text,
  medical_needs       text,

  -- child-safety screening — the operationally critical bit
  criminal_record_check text check (criminal_record_check in ('Yes','No')),
  policy_agreed       boolean not null default false,
  consent             boolean not null default false,
  signature           text,
  signed_date         date,

  status              text not null default 'new'
                      check (status in ('new','screening','approved','declined')),
  staff_notes         text,
  source_ip           text,
  user_agent          text
);

-- -------------------------------------------------------------- partnerships
create table if not exists public.partnerships (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  org_name          text not null,
  contact_person    text not null,
  title             text,
  email             text not null,
  phone             text not null,
  website           text,
  address           text,

  partnership_type  text,
  description       text,
  focus_area        text,
  prior_partnership text,
  heard_about       text,
  consent           boolean not null default false,

  status            text not null default 'new'
                    check (status in ('new','in_discussion','active','declined')),
  staff_notes       text,
  source_ip         text,
  user_agent        text
);

-- ------------------------------------------------------------------ contacts
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  first_name  text not null,
  last_name   text not null,
  email       text not null,
  message     text not null,

  is_read     boolean not null default false,
  staff_notes text,
  source_ip   text,
  user_agent  text
);

-- --------------------------------------------------------------- subscribers
-- CASL requires provable express consent: when, how, and from where.
create table if not exists public.subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  created_at      timestamptz not null default now(),

  consented_at    timestamptz not null default now(),
  consent_source  text not null,        -- e.g. 'registration_form'
  source_ip       text,
  user_agent      text,

  unsubscribed_at timestamptz
);

create index if not exists subscribers_active_idx on public.subscribers (email)
  where unsubscribed_at is null;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.registrations enable row level security;
alter table public.participants  enable row level security;
alter table public.volunteers    enable row level security;
alter table public.partnerships  enable row level security;
alter table public.contacts      enable row level security;
alter table public.subscribers   enable row level security;

-- Are you a signed-in admin? Used by every read policy below.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Admins may read everything. No INSERT/UPDATE/DELETE policies are defined for
-- anon or authenticated, so the browser cannot write — only the service role
-- (used server-side in /api/submit) can, because it bypasses RLS entirely.
do $$
declare t text;
begin
  foreach t in array array[
    'registrations','participants','volunteers','partnerships','contacts','subscribers'
  ] loop
    execute format(
      'drop policy if exists "admins read %1$s" on public.%1$I;', t);
    execute format(
      'create policy "admins read %1$s" on public.%1$I for select using (public.is_admin());', t);
  end loop;
end $$;

-- A user may read their own profile row (so /admin can check its own status).
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

-- ============================================================================
-- After running this:
--   1. Sign in to /admin once with the staff email (magic link) to create the
--      auth user, then flip the flag:
--        insert into public.profiles (id, email, is_admin)
--        select id, email, true from auth.users where email = 'staff@futurestarsfoundation.com'
--        on conflict (id) do update set is_admin = true;
--   2. Retention: registrations/participants/contacts/subscribers are to be
--      purged at 12 months (FSF's instruction). Payment records, once Stripe
--      lands, must NOT follow that rule — CRA generally requires ~6 years.
-- ============================================================================
