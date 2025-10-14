-- Fix sync function to avoid unique pair conflicts and add unified contacts getter
begin;

-- 1) Create or replace sync function with pair_key upsert protection
create or replace function public.sync_my_contacts_from_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inserted int := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Insert missing pair rows from accepted requests for the current user
  with pairs as (
    select 
      case when r.from_user_id = v_uid then r.to_user_id else r.from_user_id end as other_id
    from requests r
    where r.status = 'accepted'
      and (r.from_user_id = v_uid or r.to_user_id = v_uid)
  )
  insert into contacts (owner_id, contact_user_id, alias, pair_key)
  select 
    v_uid as owner_id,
    p.other_id as contact_user_id,
    null as alias,
    -- canonical pair key (sorted uuids) to ensure uniqueness regardless of direction
    (case when v_uid::text < p.other_id::text 
          then v_uid::text || '|' || p.other_id::text 
          else p.other_id::text || '|' || v_uid::text end) as pair_key
  from pairs p
  where not exists (
    select 1 from contacts c
    where c.pair_key = (case when v_uid::text < p.other_id::text 
                             then v_uid::text || '|' || p.other_id::text 
                             else p.other_id::text || '|' || v_uid::text end)
  )
  on conflict (pair_key) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

-- 2) Unified contacts function (works even if the stored row is oriented to the other user)
create or replace function public.get_my_contacts_unified()
returns table(
  contact_id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  city text,
  regift_enabled boolean,
  birthday date,
  global_preferences jsonb,
  occasion_prefs jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select 
    c.id as contact_id,
    (case when c.owner_id = auth.uid() then c.contact_user_id else c.owner_id end) as user_id,
    coalesce(p.first_name || ' ' || coalesce(p.last_name, ''), 'Contact') as display_name,
    p.avatar_url,
    p.city,
    coalesce(p.regift_enabled, false) as regift_enabled,
    p.birthday,
    coalesce(p.global_preferences, '{"avoid": [], "likes": [], "sizes": {}, "allergies": [], "giftIdeas": []}'::jsonb) as global_preferences,
    coalesce(p.occasion_prefs, '{}'::jsonb) as occasion_prefs
  from contacts c
  join profiles p on p.user_id = (case when c.owner_id = auth.uid() then c.contact_user_id else c.owner_id end)
  where c.owner_id = auth.uid() or c.contact_user_id = auth.uid()
  order by lower(coalesce(p.first_name || ' ' || coalesce(p.last_name, ''), 'Contact')) asc;
$$;

commit;