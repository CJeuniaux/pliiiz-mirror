-- RPC bulk: accepte une liste d'objets et résout comme la version unitaire
create or replace function request_gift_image_regen_resolve_many(payload jsonb)
returns table(result_id bigint, result_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  gift_id_val bigint;
  gift_hash_val text;
begin
  -- Vérifie les droits admin
  if not exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') then
    raise exception 'forbidden';
  end if;

  for item in select * from jsonb_array_elements(coalesce(payload, '[]'::jsonb)) loop
    begin
      -- Résolution de l'ID
      gift_id_val := (item->>'gift_idea_id')::bigint;
      
      -- Si pas d'ID direct, essaie par hash
      if gift_id_val is null and item->>'title' is not null then
        select stable_gift_idea_hash(
          item->>'title',
          item->>'category',
          item->>'occasion'
        ) into gift_hash_val;
        
        if gift_hash_val is not null then
          select id into gift_id_val
          from gift_idea_unsplash
          where gift_idea_hash = gift_hash_val
            and generator_version = 'v2'
          order by created_at desc
          limit 1;
        end if;
      end if;

      -- Si toujours pas d'ID, essaie par texte direct
      if gift_id_val is null and item->>'title' is not null then
        select id into gift_id_val
        from gift_idea_unsplash
        where gift_idea_text = (item->>'title')
          and generator_version = 'v2'
        order by created_at desc
        limit 1;
      end if;

      -- Si on a un ID, marque pour régénération
      if gift_id_val is not null then
        update gift_idea_unsplash
        set 
          image_regen_requested_at = now(),
          image_regen_reason = coalesce(item->>'reason', 'bulk-admin'),
          image_status = 'pending_regen'
        where id = gift_id_val;
        
        return query select gift_id_val, 'queued'::text;
      end if;
      
    exception when others then
      -- ignore l'item invalide pour ne pas bloquer tout le lot
      continue;
    end;
  end loop;
  
  return;
end $$;