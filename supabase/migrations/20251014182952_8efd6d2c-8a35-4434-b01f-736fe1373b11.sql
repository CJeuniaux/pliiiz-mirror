-- ===========================================
--  FIX: Triggers fautifs sur public.preferences
--  Contexte: erreur "record 'old' has no field 'global_preferences'"
--  Stratégie: supprimer UNIQUEMENT les triggers de 'preferences' dont la fonction
--             contient 'global_preferences', puis recréer un trigger sain.
--  Idempotent et sécurisé.
-- ===========================================

-- 1) SUPPRIMER UNIQUEMENT les triggers sur public.preferences qui posent problème
do $$
declare 
  r record;
  fn_def text;
begin
  for r in
    select t.tgname as trigger_name,
           p.oid    as fn_oid,
           p.proname as fn_name
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_proc  p on p.oid = t.tgfoid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal
      and n.nspname = 'public'
      and c.relname = 'preferences'  -- UNIQUEMENT sur preferences
  loop
    -- Récupérer la définition complète de la fonction
    begin
      fn_def := pg_get_functiondef(r.fn_oid);
    exception when others then
      fn_def := '';
    end;
    
    -- Si la fonction mentionne 'global_preferences' OU 'OLD.global_preferences', on supprime le trigger
    if position('global_preferences' in fn_def) > 0 then
      raise notice 'Suppression du trigger % car sa fonction contient global_preferences', r.trigger_name;
      execute format('drop trigger if exists %I on public.preferences;', r.trigger_name);
      
      -- On supprime la fonction UNIQUEMENT si elle n'est plus utilisée par d'autres triggers
      if not exists (
        select 1 from pg_trigger t2 
        where t2.tgfoid = r.fn_oid 
          and t2.tgname <> r.trigger_name
      ) then
        execute format('drop function if exists public.%I() cascade;', r.fn_name);
      end if;
    end if;
  end loop;
end $$;

-- 2) Créer une fonction propre qui met à jour profiles.global_preferences
drop function if exists public.sync_prefs_to_profile() cascade;

create or replace function public.sync_prefs_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  -- Si la colonne global_preferences n'existe pas sur profiles, on sort silencieusement
  if not exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='global_preferences'
  ) then
    return new;
  end if;

  -- Mise à jour de profiles.global_preferences avec les données de preferences
  update public.profiles p
  set global_preferences = jsonb_build_object(
                             'likes',       coalesce(new.likes, '{}'),
                             'avoid',       coalesce(new.dislikes, '{}'),
                             'allergies',   coalesce(new.allergies, '{}'),
                             'giftIdeas',   coalesce(new.gift_ideas, '{}'),
                             'sizes',       coalesce(new.sizes, '{}')
                           ),
      updated_at = now()
  where p.user_id = new.user_id;

  return new;
end
$fn$;

-- 3) Recréer un trigger SAIN sur preferences
drop trigger if exists trg_sync_prefs_to_profile on public.preferences;
create trigger trg_sync_prefs_to_profile
after insert or update on public.preferences
for each row
when (new.user_id is not null)
execute function public.sync_prefs_to_profile();