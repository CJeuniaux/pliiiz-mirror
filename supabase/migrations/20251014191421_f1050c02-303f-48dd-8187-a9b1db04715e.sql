-- RPC pour accepter une demande à partir du from_user_id (table requests)
-- Cette version travaille sur la table requests, pas connections
CREATE OR REPLACE FUNCTION public.accept_request_by_user(p_from_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_from_user uuid;
  v_to_user uuid;
  v_status text;
  v_pair text;
BEGIN
  -- Trouver la demande pending la plus récente de cet utilisateur vers moi
  SELECT id, from_user_id, to_user_id, status
    INTO v_request_id, v_from_user, v_to_user, v_status
  FROM public.requests
  WHERE from_user_id = p_from_user_id
    AND to_user_id = auth.uid()
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'Aucune demande PENDING de cet utilisateur (from_user_id=%) vers vous', p_from_user_id;
  END IF;

  IF v_status IS DISTINCT FROM 'pending' THEN
    RETURN jsonb_build_object('ok', true, 'id', v_request_id, 'note', 'déjà traitée', 'status', v_status);
  END IF;

  -- Accepter la demande
  UPDATE public.requests
  SET status = 'accepted', updated_at = now()
  WHERE id = v_request_id;

  -- Construire la clé canonique
  v_pair := public._contact_pair_key(v_from_user, v_to_user);

  -- Créer les contacts bidirectionnels (idempotent)
  -- Contact 1: from_user possède to_user
  INSERT INTO public.contacts (owner_id, contact_user_id, pair_key, created_at, updated_at)
  VALUES (v_from_user, v_to_user, v_pair, now(), now())
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- Contact 2: to_user possède from_user  
  INSERT INTO public.contacts (owner_id, contact_user_id, pair_key, created_at, updated_at)
  VALUES (v_to_user, v_from_user, v_pair, now(), now())
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- Créer les notifications
  INSERT INTO public.notifications (user_id, type, message, actor_user_id, created_at)
  VALUES 
    (v_to_user, 'connection_accepted', 'a accepté votre demande de connexion', v_from_user, now()),
    (v_from_user, 'connection_accepted', 'Vous êtes maintenant connectés', v_to_user, now())
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'id', v_request_id, 'from_user_id', v_from_user, 'to_user_id', v_to_user);

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', true, 'id', v_request_id, 'note', 'contact déjà existant');
END;
$$;

REVOKE ALL ON FUNCTION public.accept_request_by_user(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_request_by_user(uuid) TO authenticated;

-- Recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';