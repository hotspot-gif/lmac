-- ============================================================================
-- LMAC — Market Issue Reporting & Ticket Management Tool
-- Supabase PostgreSQL Schema, Security & Seed Script
-- ============================================================================
-- RUN: Supabase Dashboard → SQL Editor → New query → paste this whole file → Run
-- Safe to re-run (idempotent).
--
-- What this script creates:
--   1. Tables (matching the React app exactly):
--        staff          — user accounts (id = auth.users.id)
--        tickets        — reported issues
--        ticket_updates — activity timeline
--   2. Triggers: updated_date maintenance + race-safe ticket numbering
--   3. Row Level Security: users see only their own tickets, admins see all
--   4. Functions used by the app:
--        staff_validate_email()   — login step 1 (email check, pre-auth)
--        admin_create_staff()     — Staff Management: add staff (+ auth user)
--        admin_update_staff()     — Staff Management: edit staff (+ password
--                                   reset to new mobile number, ban/unban)
--        admin_set_staff_active() — Staff Management: deactivate/reactivate
--   5. Seed data for the initial users (passwords set at the bottom)
--
-- NOTE: Login credentials (bcrypt password hashes) live in Supabase Auth
-- (auth.users), NOT in the staff table. The staff table is profile data only.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Staff profiles. id is the SAME uuid as the Supabase Auth user.
create table if not exists public.staff (
    id              uuid primary key references auth.users(id) on delete cascade,
    full_name       text not null,
    role            text not null check (role in ('ASM', 'FSE', 'HS-ADMIN', 'PM-ADMIN', 'CS-ADMIN')),
    designation     text,
    corporate_email text not null unique,
    mobile_number   text,
    territory       text,
    is_active       boolean not null default true,
    created_date    timestamptz not null default now(),
    updated_date    timestamptz not null default now()
);

create index if not exists idx_staff_role   on public.staff (role);
create index if not exists idx_staff_active on public.staff (is_active);

-- Tickets. impact/urgency are free text on purpose — the app sends values like
-- "Telecom/POS/Activations/TopUps/MNP", "Few Customers", "No Customer Impact".
create table if not exists public.tickets (
    id                   uuid primary key default gen_random_uuid(),
    ticket_number        text not null unique,
    reporter_id          uuid not null references public.staff (id),
    reporter_name        text not null,
    reporter_email       text not null,
    reporter_role        text,
    reporter_designation text,
    reporter_territory   text,
    category             text not null,
    sub_category         text not null,
    impact               text not null,
    urgency              text not null,
    subject              text not null,
    description          text not null,
    msisdns              jsonb not null default '[]'::jsonb,
    status               text not null default 'Open'
                         check (status in ('Open', 'In Progress', 'Pending', 'Completed')),
    completed_at         timestamptz,
    created_date         timestamptz not null default now(),
    updated_date         timestamptz not null default now()
);

create index if not exists idx_tickets_reporter on public.tickets (reporter_id);
create index if not exists idx_tickets_status   on public.tickets (status);
create index if not exists idx_tickets_category on public.tickets (category);
create index if not exists idx_tickets_created  on public.tickets (created_date desc);

-- Activity timeline for every ticket
create table if not exists public.ticket_updates (
    id              uuid primary key default gen_random_uuid(),
    ticket_id       uuid not null references public.tickets (id) on delete cascade,
    update_type     text not null check (update_type in ('created', 'status_change', 'response', 'completed')),
    previous_status text,
    new_status      text,
    message         text,
    created_by      uuid not null references public.staff (id),
    created_by_name text not null,
    created_by_role text,
    created_date    timestamptz not null default now()
);

create index if not exists idx_updates_ticket  on public.ticket_updates (ticket_id);
create index if not exists idx_updates_created on public.ticket_updates (created_date desc);

-- ============================================================================
-- 2. TRIGGERS
-- ============================================================================

create or replace function public.set_updated_date()
returns trigger
language plpgsql
as $$
begin
    new.updated_date = now();
    return new;
end;
$$;

drop trigger if exists trg_staff_updated_date on public.staff;
create trigger trg_staff_updated_date
    before update on public.staff
    for each row execute function public.set_updated_date();

drop trigger if exists trg_tickets_updated_date on public.tickets;
create trigger trg_tickets_updated_date
    before update on public.tickets
    for each row execute function public.set_updated_date();

-- ----------------------------------------------------------------------------
-- Ticket numbering: INC-YYYY-000001.
-- The app may send a candidate number; if it is missing, blank, or already
-- taken (which can happen when several users report issues at once), a
-- guaranteed-unique number is generated here under an advisory lock.
-- ----------------------------------------------------------------------------
create or replace function public.generate_ticket_number()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_year int  := extract(year from now());
    v_next int;
begin
    -- Serialize concurrent generations per year to avoid duplicates
    perform pg_advisory_xact_lock(hashtext('lmac_ticket_number_' || v_year));

    select coalesce(max((substring(t.ticket_number from 9 for 6))::int), 0) + 1
      into v_next
      from public.tickets t
     where t.ticket_number like 'INC-' || v_year || '-%';

    return 'INC-' || v_year || '-' || lpad(v_next::text, 6, '0');
end;
$$;

create or replace function public.set_ticket_number()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
    if new.ticket_number is null
       or new.ticket_number = ''
       or exists (select 1 from public.tickets t where t.ticket_number = new.ticket_number) then
        new.ticket_number := public.generate_ticket_number();
    end if;
    return new;
end;
$$;

drop trigger if exists trg_tickets_number on public.tickets;
create trigger trg_tickets_number
    before insert on public.tickets
    for each row execute function public.set_ticket_number();

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================
-- All users sign in with Supabase Auth, so every request carries a JWT with
-- auth.uid() (=== staff.id). Admins are resolved with the is_admin() helper
-- (security definer, so it can read staff without RLS recursion).

alter table public.staff enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_updates enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
    select exists (
        select 1 from public.staff
        where id = auth.uid()
          and is_active
          and role in ('HS-ADMIN', 'PM-ADMIN', 'CS-ADMIN')
    );
$$;

-- Staff ---------------------------------------------------------------------
-- Any signed-in user can read staff profiles (needed for ticket context).
-- There is NO anon policy: anonymous callers cannot read the staff table.
-- There is NO insert/delete policy: staff rows are only created through the
-- admin_* SQL functions below (SECURITY DEFINER bypasses RLS).
drop policy if exists "staff_read_authenticated" on public.staff;
create policy "staff_read_authenticated" on public.staff
    for select to authenticated
    using (true);

drop policy if exists "staff_admin_update" on public.staff;
create policy "staff_admin_update" on public.staff
    for update to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Tickets -------------------------------------------------------------------
-- Standard users see only their own tickets; admins see everything.
drop policy if exists "tickets_select_own_or_admin" on public.tickets;
create policy "tickets_select_own_or_admin" on public.tickets
    for select to authenticated
    using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "tickets_insert_own" on public.tickets;
create policy "tickets_insert_own" on public.tickets
    for insert to authenticated
    with check (reporter_id = auth.uid());

drop policy if exists "tickets_update_admin" on public.tickets;
create policy "tickets_update_admin" on public.tickets
    for update to authenticated
    using (public.is_admin());

-- Ticket updates ------------------------------------------------------------
drop policy if exists "updates_select_visible" on public.ticket_updates;
create policy "updates_select_visible" on public.ticket_updates
    for select to authenticated
    using (
        exists (
            select 1 from public.tickets t
            where t.id = ticket_id
              and (t.reporter_id = auth.uid() or public.is_admin())
        )
    );

drop policy if exists "updates_insert_visible" on public.ticket_updates;
create policy "updates_insert_visible" on public.ticket_updates
    for insert to authenticated
    with check (
        created_by = auth.uid()
        and (
            public.is_admin()
            or exists (
                select 1 from public.tickets t
                where t.id = ticket_id
                  and t.reporter_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- 4. FUNCTIONS USED BY THE APP (SECURITY DEFINER)
-- ============================================================================

-- Login step 1: check a corporate email against ACTIVE staff accounts.
-- Callable before sign-in (anon), returns only the display name — never
-- password material.
create or replace function public.staff_validate_email(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_full_name text;
begin
    select s.full_name into v_full_name
      from public.staff s
     where s.corporate_email = lower(trim(p_email))
       and s.is_active
     limit 1;

    if v_full_name is null then
        return jsonb_build_object('found', false, 'user', null);
    end if;

    return jsonb_build_object(
        'found', true,
        'user', jsonb_build_object('full_name', v_full_name)
    );
end;
$$;

-- Staff Management: create a staff member AND their Supabase Auth user in one
-- call. Default password = mobile number (bcrypt inside auth.users).
create or replace function public.admin_create_staff(
    p_full_name       text,
    p_role            text,
    p_corporate_email text,
    p_mobile_number   text,
    p_designation     text default null,
    p_territory       text default null
)
returns public.staff
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_user_id uuid;
    v_email   text := lower(trim(p_corporate_email));
begin
    if not public.is_admin() then
        raise exception 'Only administrators can manage staff.';
    end if;

    if coalesce(p_full_name, '') = '' or v_email = '' or coalesce(p_mobile_number, '') = '' then
        raise exception 'Full name, corporate email and mobile number are required.';
    end if;

    if exists (select 1 from auth.users where lower(email) = v_email)
       or exists (select 1 from public.staff where corporate_email = v_email) then
        raise exception 'A user with this email already exists.';
    end if;

    insert into auth.users (
        id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        v_email,
        crypt(p_mobile_number, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', p_full_name),
        now(),
        now()
    ) returning id into v_user_id;

    insert into public.staff (
        id, full_name, role, designation, corporate_email, mobile_number, territory, is_active
    ) values (
        v_user_id, p_full_name, p_role, p_designation, v_email, p_mobile_number, p_territory, true
    );

    return (select s.* from public.staff s where s.id = v_user_id);
end;
$$;

-- Staff Management: edit a staff member and keep their auth user in sync.
-- - Changing the mobile number RESETS the password to the new mobile number.
-- - Setting is_active = false also bans the auth user (and unbans on reactivation).
-- - Changing the corporate email updates the auth user's email too.
create or replace function public.admin_update_staff(
    p_staff_id        uuid,
    p_full_name       text,
    p_role            text,
    p_corporate_email text,
    p_mobile_number   text,
    p_is_active       boolean default true,
    p_designation     text default null,
    p_territory       text default null
)
returns public.staff
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_existing public.staff;
    v_email    text := lower(trim(p_corporate_email));
begin
    if not public.is_admin() then
        raise exception 'Only administrators can manage staff.';
    end if;

    select * into v_existing from public.staff where id = p_staff_id;
    if v_existing.id is null then
        raise exception 'Staff member not found.';
    end if;

    if v_email <> v_existing.corporate_email then
        if exists (select 1 from auth.users where lower(email) = v_email and id <> p_staff_id)
           or exists (select 1 from public.staff where corporate_email = v_email and id <> p_staff_id) then
            raise exception 'A user with this email already exists.';
        end if;

        update auth.users
           set email = v_email,
               email_confirmed_at = coalesce(email_confirmed_at, now()),
               updated_at = now()
         where id = p_staff_id;
    end if;

    if p_mobile_number <> v_existing.mobile_number then
        update auth.users
           set encrypted_password = crypt(p_mobile_number, gen_salt('bf')),
               updated_at = now()
         where id = p_staff_id;
    end if;

    update auth.users
       set banned_until = case when p_is_active then null else 'infinity'::timestamptz end,
           updated_at   = now()
     where id = p_staff_id;

    update public.staff
       set full_name       = p_full_name,
           role            = p_role,
           designation     = p_designation,
           corporate_email = v_email,
           mobile_number   = p_mobile_number,
           territory       = p_territory,
           is_active       = p_is_active
     where id = p_staff_id;

    return (select s.* from public.staff s where s.id = p_staff_id);
end;
$$;

-- Staff Management: deactivate / reactivate a staff member.
create or replace function public.admin_set_staff_active(
    p_staff_id  uuid,
    p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
    if not public.is_admin() then
        raise exception 'Only administrators can manage staff.';
    end if;

    update public.staff
       set is_active = p_is_active
     where id = p_staff_id;

    update auth.users
       set banned_until = case when p_is_active then null else 'infinity'::timestamptz end,
           updated_at   = now()
     where id = p_staff_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Permissions:
--   staff_validate_email  — callable before sign-in (anon) + by signed-in users
--   admin_* functions     — signed-in users only; each one re-checks is_admin()
-- ----------------------------------------------------------------------------
revoke execute on function public.staff_validate_email(text) from public;
grant execute on function public.staff_validate_email(text) to anon, authenticated;

revoke execute on function public.admin_create_staff(text, text, text, text, text, text) from public, anon;
grant execute on function public.admin_create_staff(text, text, text, text, text, text) to authenticated;

revoke execute on function public.admin_update_staff(uuid, text, text, text, text, boolean, text, text) from public, anon;
grant execute on function public.admin_update_staff(uuid, text, text, text, text, boolean, text, text) to authenticated;

revoke execute on function public.admin_set_staff_active(uuid, boolean) from public, anon;
grant execute on function public.admin_set_staff_active(uuid, boolean) to authenticated;

-- ============================================================================
-- 5. SEED DATA — INITIAL USERS
-- ============================================================================
-- Passwords live in Supabase Auth (auth.users, bcrypt):
--   Standard users (ASM, FSE): default password = their mobile number
--   Admin users (HS-ADMIN, PM-ADMIN, CS-ADMIN): default password = 'Lyca@2026'
--
-- seed_staff() is a one-off helper that creates BOTH the auth user and the
-- staff profile, and skips users that already exist (safe to re-run).
-- Add the remaining staff here (one line per user) or create them later from
-- the app's Staff Management page (admins only). Delete this helper afterwards
-- if you prefer — the app itself only needs the admin_* functions above.
-- ============================================================================
create or replace function public.seed_staff(
    p_full_name       text,
    p_role            text,
    p_designation     text,
    p_corporate_email text,
    p_mobile_number   text,
    p_password        text,
    p_territory       text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_id    uuid;
    v_email text := lower(trim(p_corporate_email));
begin
    if exists (select 1 from public.staff where corporate_email = v_email) then
        raise notice 'Skipping % — staff already exists', v_email;
        return;
    end if;

    select id into v_id from auth.users where lower(email) = v_email;

    if v_id is null then
        insert into auth.users (
            id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) values (
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            v_email,
            crypt(p_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', p_full_name),
            now(),
            now()
        ) returning id into v_id;
    end if;

    insert into public.staff (
        id, full_name, role, designation, corporate_email, mobile_number, territory, is_active
    ) values (
        v_id, p_full_name, p_role, p_designation, v_email, p_mobile_number, p_territory, true
    );
end;
$$;

-- Standard users — password = mobile number
select public.seed_staff(
    'Stelwin Kachappilly', 'ASM', 'Bari Office Manager Admin',
    'stelwin.kachappilly@universalservice.it', '3510023408', '3510023408', 'LMIT-HS-BARI'
);
select public.seed_staff(
    'Lindon Francesco', 'FSE', null,
    'lindon.francesco@universalservice.it', '3512359754', '3512359754', null
);

-- Admin users — password = 'Lyca@2026'
select public.seed_staff(
    'DILAN FERNANDO', 'HS-ADMIN', 'Hotspot Manager Admin',
    'dilan.fernando@universalservice.it', '3510016000', 'Lyca@2026', 'ITALY'
);
select public.seed_staff(
    'Sohan Fernando', 'PM-ADMIN', null,
    'sohan.fernando@universalservice.it', null, 'Lyca@2026', null
);
select public.seed_staff(
    'Elisabetta A.', 'CS-ADMIN', null,
    'elisabetta.a@universalservice.it', null, 'Lyca@2026', null
);
-- ... add the remaining staff accounts here (one seed_staff() call per user).

-- ============================================================================
-- 6. VERIFY (optional) — run these to confirm the setup
-- ============================================================================
-- select corporate_email, role, is_active from public.staff order by role;
-- select email, email_confirmed_at is not null as confirmed, banned_until
--   from auth.users order by email;
-- select public.staff_validate_email('dilan.fernando@universalservice.it');

-- ============================================================================
-- 7. MIGRATING EXISTING DATA FROM BASE44 (optional)
-- ============================================================================
-- Export your Staff / Ticket / TicketUpdate entities from Base44 (CSV/JSON),
-- then import with COPY or INSERT. Two important notes:
--   1. staff.id must equal the auth.users.id for that person — the easiest
--      path is to first create every staff account (seed_staff above or the
--      Staff Management UI), then match rows by corporate_email during import.
--   2. ticket numbers from Base44 are preserved: the trg_tickets_number
--      trigger only generates a number when the incoming one is empty or
--      already taken.
--
-- Example (after exporting tickets to CSV and staging it):
--   insert into public.tickets
--       (ticket_number, reporter_id, reporter_name, reporter_email, reporter_role,
--        reporter_designation, reporter_territory, category, sub_category,
--        impact, urgency, subject, description, msisdns, status, completed_at, created_date)
--   select t.ticket_number, s.id, t.reporter_name, t.reporter_email, t.reporter_role,
--          t.reporter_designation, t.reporter_territory, t.category, t.sub_category,
--          t.impact, t.urgency, t.subject, t.description,
--          coalesce(t.msisdns::jsonb, '[]'::jsonb),
--          t.status, t.completed_at, t.created_date
--     from staging_base44_tickets t
--     join public.staff s on s.corporate_email = lower(t.reporter_email);