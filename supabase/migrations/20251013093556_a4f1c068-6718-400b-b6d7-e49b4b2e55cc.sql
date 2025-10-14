-- Vue détaillée: accepted sans contact avec noms et sens manquant
create or replace view public.vw_accepted_contact_gaps as
with acc as (
  select r.id as request_id, r.from_user_id as a, r.to_user_id as b, r.created_at
  from public.requests r
  where r.status = 'accepted'
)
select
  acc.request_id,
  acc.a as from_user_id,
  pf.first_name || ' ' || coalesce(pf.last_name, '') as from_name,
  acc.b as to_user_id,
  pt.first_name || ' ' || coalesce(pt.last_name, '') as to_name,
  acc.created_at,
  -- manques par sens
  (not exists (select 1 from public.contacts c where c.owner_id = acc.a and c.contact_user_id = acc.b)) as missing_a_to_b,
  (not exists (select 1 from public.contacts c where c.owner_id = acc.b and c.contact_user_id = acc.a)) as missing_b_to_a
from acc
left join public.profiles pf on pf.user_id = acc.a
left join public.profiles pt on pt.user_id = acc.b
where
  (not exists (select 1 from public.contacts c where c.owner_id = acc.a and c.contact_user_id = acc.b))
  or
  (not exists (select 1 from public.contacts c where c.owner_id = acc.b and c.contact_user_id = acc.a))
order by acc.created_at desc;

-- RPC: fixer une paire précise (A->B, B->A ou les deux)
create or replace function public.resync_contact_pair(
  from_id uuid,
  to_id uuid,
  create_a_to_b boolean default true,
  create_b_to_a boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if create_a_to_b then
    insert into public.contacts(owner_id, contact_user_id, created_at)
    values (from_id, to_id, now())
    on conflict (owner_id, contact_user_id) do nothing;
  end if;

  if create_b_to_a then
    insert into public.contacts(owner_id, contact_user_id, created_at)
    values (to_id, from_id, now())
    on conflict (owner_id, contact_user_id) do nothing;
  end if;
end;
$$;