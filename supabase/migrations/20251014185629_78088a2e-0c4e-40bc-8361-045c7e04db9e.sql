-- Helper: génère une clé canonique pour une paire d'utilisateurs
CREATE OR REPLACE FUNCTION public._contact_pair_key(a uuid, b uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT least(a, b)::text || '|' || greatest(a, b)::text;
$$;

-- RPC idempotente pour accepter une demande de connexion
CREATE OR REPLACE FUNCTION public.accept_connection_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_user uuid;
  v_to_user uuid;
  v_status text;
  v_pair_key text;
BEGIN
  -- Verrouille la ligne pour éviter les conditions de course
  SELECT from_user_id, to_user_id, status
    INTO v_from_user, v_to_user, v_status
  FROM public.requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_to_user IS NULL THEN
    RAISE EXCEPTION 'Demande introuvable';
  END IF;

  IF v_to_user <> auth.uid() THEN
    RAISE EXCEPTION 'Vous ne pouvez pas accepter cette demande';
  END IF;

  -- Si déjà traitée, on rend l'opération idempotente
  IF v_status IS DISTINCT FROM 'pending' THEN
    RETURN jsonb_build_object(
      'ok', true, 
      'id', p_request_id, 
      'note', 'déjà traitée',
      'status', v_status
    );
  END IF;

  -- 1) Accepter la demande
  UPDATE public.requests
  SET status = 'accepted',
      updated_at = now()
  WHERE id = p_request_id;

  -- 2) Générer la clé canonique
  v_pair_key := public._contact_pair_key(v_from_user, v_to_user);

  -- 3) Créer les contacts bidirectionnels (ou ignorer si existants)
  -- Contact 1: from_user possède to_user
  INSERT INTO public.contacts (owner_id, contact_user_id, created_at, updated_at)
  VALUES (v_from_user, v_to_user, now(), now())
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- Contact 2: to_user possède from_user
  INSERT INTO public.contacts (owner_id, contact_user_id, created_at, updated_at)
  VALUES (v_to_user, v_from_user, now(), now())
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- 4) Créer les notifications (idempotentes)
  INSERT INTO public.notifications (user_id, type, message, actor_user_id, created_at)
  VALUES 
    (v_to_user, 'connection_accepted', 'a accepté votre demande de connexion', v_from_user, now()),
    (v_from_user, 'connection_accepted', 'Vous êtes maintenant connectés', v_to_user, now())
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true, 
    'id', p_request_id,
    'from_user_id', v_from_user,
    'to_user_id', v_to_user
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Si une contrainte unique est violée malgré ON CONFLICT, on considère l'opération réussie
    RETURN jsonb_build_object(
      'ok', true, 
      'id', p_request_id, 
      'note', 'contact déjà existant'
    );
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.accept_connection_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_connection_request(uuid) TO authenticated;