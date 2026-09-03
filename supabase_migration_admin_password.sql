-- LEGACY MIGRATION: do not run this for a clean installation.
--
-- The old migration preserved broken Auth rows. For the requested reset, run
-- the complete supabase_schema.sql instead. It removes app data and Auth
-- users, recreates all functions, and seeds the initial administrator.

drop function if exists public.admin_create_staff(text, text, text, text, text, text);
drop function if exists public.admin_create_staff(text, text, text, text, text, text, text);

create or replace function public.admin_create_staff(
    p_full_name       text,
    p_role            text,
    p_corporate_email text,
    p_mobile_number   text,
    p_password        text,
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
    v_staff   public.staff;
begin
    if not public.is_admin() then
        raise exception 'Only administrators can manage staff.';
    end if;

    if coalesce(trim(p_full_name), '') = ''
       or coalesce(v_email, '') = ''
       or coalesce(trim(p_mobile_number), '') = ''
       or coalesce(p_password, '') = '' then
        raise exception 'Full name, corporate email, mobile number and password are required.';
    end if;

    if length(p_password) < 6 then
        raise exception 'Password must be at least 6 characters.';
    end if;

    if p_role is null or p_role not in ('ASM', 'FSE', 'HS-ADMIN', 'PM-ADMIN', 'CS-ADMIN') then
        raise exception 'A valid staff role is required.';
    end if;

    if exists (select 1 from public.staff where lower(corporate_email) = v_email) then
        raise exception 'A user with this email already exists.';
    end if;

    -- A deleted staff profile may leave its Auth row behind. Reuse that row
    -- instead of treating it as a new-user conflict.
    select id into v_user_id
      from auth.users
     where lower(email) = v_email
         limit 1;

    if v_user_id is null then
        insert into auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) values (
            coalesce((select id from auth.instances limit 1), '00000000-0000-0000-0000-000000000000'::uuid),
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
        ) returning id into v_user_id;
    else
        update auth.users
           set instance_id = coalesce(instance_id, '00000000-0000-0000-0000-000000000000'::uuid),
               encrypted_password = crypt(p_password, gen_salt('bf')),
               email_confirmed_at = coalesce(email_confirmed_at, now()),
               banned_until = null,
               raw_user_meta_data = jsonb_build_object('full_name', p_full_name),
               updated_at = now()
         where id = v_user_id;
    end if;

    -- GoTrue expects an email identity alongside the Auth user row.
    insert into auth.identities (
        id, user_id, provider_id, identity_data, provider, created_at, updated_at
    )
    select gen_random_uuid(), v_user_id, v_email,
           jsonb_build_object('sub', v_user_id::text, 'email', v_email),
           'email', now(), now()
     where not exists (
         select 1 from auth.identities
          where provider = 'email' and provider_id = v_email
     );

    insert into public.staff (
        id, full_name, role, designation, corporate_email, mobile_number, territory, is_active
    ) values (
        v_user_id, p_full_name, p_role, p_designation, v_email, p_mobile_number, p_territory, true
    ) returning * into v_staff;

    return v_staff;
end;
$$;

-- SECURITY DEFINER must be owned by the privileged database role because this
-- function writes to Supabase's protected auth schema.
alter function public.admin_create_staff(text, text, text, text, text, text, text)
    owner to postgres;

revoke execute on function public.admin_create_staff(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.admin_create_staff(text, text, text, text, text, text, text) to authenticated;

-- Backward compatibility for a frontend bundle that has not been redeployed
-- yet. New clients use the seven-argument function above and an explicit
-- password; legacy clients temporarily use the mobile number as the password.
create or replace function public.admin_create_staff(
    p_full_name       text,
    p_role            text,
    p_corporate_email text,
    p_mobile_number   text,
    p_designation     text default null,
    p_territory       text default null
)
returns public.staff
language sql
security definer
set search_path = public, extensions
as $$
    select public.admin_create_staff(
        p_full_name, p_role, p_corporate_email, p_mobile_number,
        p_mobile_number, p_designation, p_territory
    );
$$;

revoke execute on function public.admin_create_staff(text, text, text, text, text, text) from public, anon;
grant execute on function public.admin_create_staff(text, text, text, text, text, text) to authenticated;

-- Repair staff profiles created by the old staff-only implementation.
-- Those users can sign in with their existing mobile number after this runs.
do $$
declare
    v_staff record;
begin
    for v_staff in
        select s.id, s.corporate_email, s.full_name, s.mobile_number
          from public.staff s
         where not exists (select 1 from auth.users u where u.id = s.id)
                     and coalesce(trim(s.mobile_number), '') <> ''
           and not exists (
               select 1 from auth.users u
                where lower(u.email) = lower(s.corporate_email)
           )
    loop
        insert into auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) values (
            coalesce((select id from auth.instances limit 1), '00000000-0000-0000-0000-000000000000'::uuid),
            v_staff.id,
            'authenticated',
            'authenticated',
            lower(trim(v_staff.corporate_email)),
            crypt(v_staff.mobile_number, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', v_staff.full_name),
            now(),
            now()
        );

        insert into auth.identities (
            id, user_id, provider_id, identity_data, provider, created_at, updated_at
        ) values (
            gen_random_uuid(), v_staff.id, lower(trim(v_staff.corporate_email)),
            jsonb_build_object('sub', v_staff.id::text, 'email', lower(trim(v_staff.corporate_email))),
            'email', now(), now()
        );
    end loop;
end;
$$;

-- Normalize manually-created Auth rows before GoTrue queries them.
update auth.users
    set instance_id = coalesce((select id from auth.instances limit 1), '00000000-0000-0000-0000-000000000000'::uuid),
         aud = coalesce(aud, 'authenticated'),
         role = coalesce(role, 'authenticated'),
         email = lower(trim(email)),
         email_confirmed_at = coalesce(email_confirmed_at, created_at, now()),
       updated_at = now()
 where email is not null;

-- Normalize an existing email identity before creating any missing ones.
update auth.identities i
    set provider_id = lower(trim(u.email)),
         identity_data = jsonb_build_object('sub', u.id::text, 'email', lower(trim(u.email))),
         updated_at = now()
  from auth.users u
 where i.user_id = u.id
    and i.provider = 'email'
    and u.email is not null;

-- Repair Auth users created without their email identity.
insert into auth.identities (
        id, user_id, provider_id, identity_data, provider, created_at, updated_at
)
select gen_random_uuid(), u.id, lower(trim(u.email)),
             jsonb_build_object('sub', u.id::text, 'email', lower(trim(u.email))),
             'email', now(), now()
    from auth.users u
 where u.email is not null
     and not exists (
             select 1 from auth.identities i
                where i.provider = 'email' and i.provider_id = lower(trim(u.email))
     );

-- Make the new RPC visible to PostgREST immediately.
notify pgrst, 'reload schema';

-- Optional verification:
-- select n.nspname, p.proname, pg_get_function_arguments(p.oid)
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname = 'admin_create_staff';

-- Verification (run separately after this migration if login still fails):
-- select u.id, u.email, u.instance_id, u.aud, u.role,
--        u.email_confirmed_at, i.provider, i.provider_id
--   from auth.users u
--   left join auth.identities i on i.user_id = u.id and i.provider = 'email'
--  where lower(u.email) = lower('user@example.com');
