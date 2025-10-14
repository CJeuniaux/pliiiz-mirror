create or replace function public.request_gift_image_regen_resolve_dbg(
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
  v_is_admin boolean := exists (select 1 from public.user_roles where user_id = v_uid and role = 'admin');
  v_payload jsonb := jsonb_build_object(
    'suggestion_id', p_suggestion_id, 'owner_id', p_owner_id,
    'gift_id', p_gift_id, 'title', p_title, 'category', p_category, 'occasion', p_occasion, 'reason', p_reason
  );
  v_id bigint;
  c_id int := 0;
  c_hash int := 0;
  c_text int := 0;
  v_err text := null;
  v_method text := null;
  v_hash text;
begin
  if not v_is_admin then
    v_err := 'forbidden:not_admin';
  else
    -- A) par id direct (bigint)
    if p_suggestion_id is not null then
      begin
        v_id := (p_suggestion_id)::bigint;
        if exists(select 1 from gift_idea_unsplash where id = v_id) then
          c_id := 1;
          v_method := 'by_id';
        else
          v_id := null;
          c_id := 0;
        end if;
      exception when others then
        v_id := null;
        c_id := 0;
      end;
    end if;

    -- B) par hash stable (title+category+occasion)
    if v_id is null and coalesce(p_title,'') <> '' then
      select stable_gift_idea_hash(p_title, p_category, p_occasion) into v_hash;
      if v_hash is not null then
        -- v2 d'abord
        select id into v_id
        from gift_idea_unsplash
        where gift_idea_hash = v_hash and generator_version = 'v2'
        order by created_at desc
        limit 1;
        get diagnostics c_hash = row_count;
        if v_id is null then
          -- fallback: n'importe quelle version
          select id into v_id
          from gift_idea_unsplash
          where gift_idea_hash = v_hash
          order by created_at desc
          limit 1;
          if found then c_hash := 1; end if;
        end if;
        if v_id is not null then v_method := 'by_hash'; end if;
      end if;
    end if;

    -- C) par texte direct
    if v_id is null and coalesce(p_title,'') <> '' then
      -- v2 d'abord
      select id into v_id
      from gift_idea_unsplash
      where gift_idea_text = p_title and generator_version = 'v2'
      order by created_at desc
      limit 1;
      get diagnostics c_text = row_count;
      if v_id is null then
        -- fallback: n'importe quelle version
        select id into v_id
        from gift_idea_unsplash
        where gift_idea_text = p_title
        order by created_at desc
        limit 1;
        if found then c_text := 1; end if;
      end if;
      if v_id is not null then v_method := 'by_text'; end if;
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

  insert into gift_image_regen_log(caller, payload, resolved_id, method, found_by_id, found_by_hash, found_by_text, error)
  values (v_uid, v_payload, v_id, v_method, c_id, c_hash, c_text, v_err);

  return jsonb_build_object(
    'ok', (v_err is null),
    'resolved_id', v_id,
    'method', v_method,
    'counts', jsonb_build_object('by_id',c_id,'by_hash',c_hash,'by_text',c_text),
    'error', v_err,
    'payload', v_payload
  );
end $$;