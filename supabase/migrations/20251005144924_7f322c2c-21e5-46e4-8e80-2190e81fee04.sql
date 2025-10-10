-- A) RLS policies pour gift_idea_unsplash - admins peuvent UPDATE et SELECT
drop policy if exists "admin_update_all" on gift_idea_unsplash;
create policy "admin_update_all" on gift_idea_unsplash
for update using (
  exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
);

drop policy if exists "admin_select_all" on gift_idea_unsplash;
create policy "admin_select_all" on gift_idea_unsplash
for select using (
  exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
);

-- B) RPC DEBUG avec candidats et diagnostics complets
create or replace function request_gift_image_regen_resolve_dbg2(
  p_suggestion_id text default null,
  p_owner_id text default null,
  p_gift_id text default null,
  p_title text default null,
  p_category text default null,
  p_occasion text default null,
  p_reason text default 'manual'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean := exists (select 1 from user_roles where user_id = v_uid and role = 'admin');
  v_id bigint := null;
  v_err text := null;
  v_method text := null;
  v_hash text := stable_gift_idea_hash(p_title, p_category, p_occasion);
  cand jsonb := '[]'::jsonb;
begin
  if not v_is_admin then
    v_err := 'forbidden:not_admin';
  else
    -- Collecte des candidats possibles
    -- 1) Par titre exact (slugifié)
    cand := cand || coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'text', gift_idea_text,
        'hash', gift_idea_hash,
        'version', generator_version,
        'src', 'by_text'
      ))
      from gift_idea_unsplash
      where p_title is not null 
        and util_slugify(gift_idea_text) = util_slugify(p_title)
      limit 10
    ), '[]'::jsonb);

    -- 2) Par hash stable
    cand := cand || coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'text', gift_idea_text,
        'hash', gift_idea_hash,
        'version', generator_version,
        'src', 'by_hash'
      ))
      from gift_idea_unsplash
      where p_title is not null 
        and gift_idea_hash = v_hash
      limit 10
    ), '[]'::jsonb);

    -- 3) Par user_id (si fourni)
    if p_owner_id is not null then
      cand := cand || coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', id,
          'text', gift_idea_text,
          'hash', gift_idea_hash,
          'version', generator_version,
          'src', 'by_owner'
        ))
        from gift_idea_unsplash
        where user_id = (p_owner_id)::uuid
        limit 10
      ), '[]'::jsonb);
    end if;

    -- Résolution par ordre de priorité
    -- 1) ID direct
    if p_suggestion_id is not null then
      begin
        v_id := (p_suggestion_id)::bigint;
        if exists(select 1 from gift_idea_unsplash where id = v_id) then
          v_method := 'by_id';
        else
          v_id := null;
        end if;
      exception when others then
        v_id := null;
      end;
    end if;

    -- 2) Hash stable (priorité v2)
    if v_id is null and p_title is not null then
      select id into v_id
      from gift_idea_unsplash
      where gift_idea_hash = v_hash
        and generator_version = 'v2'
      order by created_at desc
      limit 1;
      if v_id is not null then 
        v_method := 'by_hash_v2'; 
      else
        -- Fallback toutes versions
        select id into v_id
        from gift_idea_unsplash
        where gift_idea_hash = v_hash
        order by created_at desc
        limit 1;
        if v_id is not null then v_method := 'by_hash_any'; end if;
      end if;
    end if;

    -- 3) Texte exact (priorité v2)
    if v_id is null and p_title is not null then
      select id into v_id
      from gift_idea_unsplash
      where util_slugify(gift_idea_text) = util_slugify(p_title)
        and generator_version = 'v2'
      order by created_at desc
      limit 1;
      if v_id is not null then 
        v_method := 'by_text_v2'; 
      else
        -- Fallback toutes versions
        select id into v_id
        from gift_idea_unsplash
        where util_slugify(gift_idea_text) = util_slugify(p_title)
        order by created_at desc
        limit 1;
        if v_id is not null then v_method := 'by_text_any'; end if;
      end if;
    end if;

    if v_id is null then
      v_err := 'reference_not_found';
    else
      update gift_idea_unsplash
      set image_regen_requested_at = now(),
          image_regen_reason = coalesce(p_reason, 'manual'),
          image_status = 'pending_regen'
      where id = v_id;
    end if;
  end if;

  -- Log avec candidats
  insert into gift_image_regen_log(caller, payload, resolved_id, method, found_by_id, found_by_hash, found_by_text, error)
  values (
    v_uid,
    jsonb_build_object(
      'suggestion_id', p_suggestion_id,
      'owner_id', p_owner_id,
      'gift_id', p_gift_id,
      'title', p_title,
      'category', p_category,
      'occasion', p_occasion,
      'hash', v_hash,
      'candidates_count', jsonb_array_length(cand)
    ),
    v_id,
    v_method,
    case when v_method like '%_id%' then 1 else 0 end,
    case when v_method like '%hash%' then 1 else 0 end,
    case when v_method like '%text%' then 1 else 0 end,
    v_err
  );

  return jsonb_build_object(
    'ok', (v_err is null),
    'resolved_id', v_id,
    'method', v_method,
    'hash', v_hash,
    'candidates', cand,
    'error', v_err,
    'payload', jsonb_build_object(
      'title', p_title,
      'category', p_category,
      'occasion', p_occasion
    )
  );
end $$;