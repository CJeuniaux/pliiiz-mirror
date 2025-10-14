-- Améliorer la RPC accept_connection avec des messages d'erreur explicites
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
  -- Cherche la ligne SANS filtre d'identité (pour un message d'erreur clair)
  SELECT requester_id, target_id, status
    INTO v_req, v_tgt, v_status
  FROM public.connections
  WHERE id = p_conn_id
  FOR UPDATE;

  IF v_tgt IS NULL THEN
    RAISE EXCEPTION 'Demande introuvable dans connections (id=%)', p_conn_id;
  END IF;

  IF v_tgt <> auth.uid() THEN
    RAISE EXCEPTION 'Cette demande ne vous appartient pas (target_id=%, vous=%)', v_tgt, auth.uid();
  END IF;

  IF v_status IS DISTINCT FROM 'pending' THEN
    RETURN jsonb_build_object('ok', true, 'id', p_conn_id, 'note', 'déjà traitée', 'status', v_status);
  END IF;

  -- Accepter
  UPDATE public.connections
  SET status = 'accepted', updated_at = now()
  WHERE id = p_conn_id;

  -- Construire la clé canonique
  v_pair := public._contact_pair_key(v_req, v_tgt);

  -- Insérer le contact (idempotent)
  INSERT INTO public.contacts (owner_id, contact_user_id, pair_key, created_at, updated_at)
  VALUES (least(v_req, v_tgt), greatest(v_req, v_tgt), v_pair, now(), now())
  ON CONFLICT ON CONSTRAINT contacts_pair_key_unique DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'id', p_conn_id);

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', true, 'id', p_conn_id, 'note', 'contact déjà existant');
END;
$$;

-- Recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';