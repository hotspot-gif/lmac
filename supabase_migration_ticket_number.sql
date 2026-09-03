-- Fix ticket numbering for databases created before the generator offset fix.
-- Run this once in the Supabase SQL Editor.

create or replace function public.generate_ticket_number()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_year int := extract(year from now());
    v_next int;
begin
    perform pg_advisory_xact_lock(hashtext('lmac_ticket_number_' || v_year));

    select coalesce(max((substring(t.ticket_number from 10 for 6))::int), 0) + 1
      into v_next
      from public.tickets t
     where t.ticket_number like 'INC-' || v_year || '-%';

    return 'INC-' || v_year || '-' || lpad(v_next::text, 6, '0');
end;
$$;
