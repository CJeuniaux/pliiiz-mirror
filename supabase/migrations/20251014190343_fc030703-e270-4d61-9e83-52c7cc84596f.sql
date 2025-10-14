-- 1) Supprimer d'abord les anciennes versions de la fonction
DROP FUNCTION IF EXISTS public.accept_connection(uuid);
DROP FUNCTION IF EXISTS public.accept_connection_request(uuid);

-- 2) Supprimer les triggers qui insèrent dans public.contacts (doublons)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname AS trigger_name,
           c.relname AS table_name,
           p.oid AS fn_oid,
           (SELECT pg_get_function_identity_arguments(p.oid)) AS fn_args,
           (SELECT n2.nspname FROM pg_namespace n2 WHERE n2.oid = p.pronamespace) AS fn_schema,
           p.proname AS fn_name
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_proc  p ON p.oid = t.tgfoid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal AND n.nspname = 'public'
  LOOP
    IF position('insert into public.contacts' IN lower(pg_get_functiondef(r.fn_oid))) > 0 THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I;', r.trigger_name, 'public', r.table_name);
      EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s);', r.fn_schema, r.fn_name, r.fn_args);
    END IF;
  END LOOP;
END $$;

-- 3) Helper: clé canonique pour paire d'utilisateurs
CREATE OR REPLACE FUNCTION public._contact_pair_key(a uuid, b uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT least(a, b)::text || '|' || greatest(a, b)::text;
$$;

-- 4) RPC idempotente basée sur la table connections
-- Utilise la contrainte nommée contacts_pair_key_unique pour ignorer les doublons
CREATE OR REPLACE FUNCTION public.accept_connection(p_conn_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req uuid;
  v_tgt uuid;
  v_status text;
  v_pair text;
BEGIN
  -- Verrouillage de la ligne pour éviter les courses
  SELECT requester_id, target_id, status
    INTO v_req, v_tgt, v_status
  FROM public.connections
  WHERE id = p_conn_id
  FOR UPDATE;

  IF v_tgt IS NULL THEN
    RAISE EXCEPTION 'Demande introuvable';
  END IF;
  IF v_tgt <> auth.uid() THEN
    RAISE EXCEPTION 'Vous ne pouvez pas accepter cette demande';
  END IF;

  -- Idempotent si déjà traité
  IF v_status IS DISTINCT FROM 'pending' THEN
    RETURN jsonb_build_object('ok', true, 'id', p_conn_id, 'note', 'déjà traité');
  END IF;

  -- 4.1 Accepter
  UPDATE public.connections
  SET status = 'accepted', updated_at = now()
  WHERE id = p_conn_id;

  -- 4.2 Construire la clé de paire canonique
  v_pair := public._contact_pair_key(v_req, v_tgt);

  -- 4.3 Créer une seule ligne de contact pour la paire (ordre canonique)
  INSERT INTO public.contacts (owner_id, contact_user_id, pair_key, created_at, updated_at)
  VALUES (least(v_req, v_tgt), greatest(v_req, v_tgt), v_pair, now(), now())
  ON CONFLICT ON CONSTRAINT contacts_pair_key_unique DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'id', p_conn_id);

EXCEPTION
  WHEN unique_violation THEN
    -- Filet de sécurité si une autre contrainte unique est violée
    RETURN jsonb_build_object('ok', true, 'id', p_conn_id, 'note', 'contact déjà existant');
END;
$$;

-- 5) Permissions
REVOKE ALL ON FUNCTION public.accept_connection(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_connection(uuid) TO authenticated;