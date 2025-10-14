-- A. RLS sur contacts : autoriser la lecture bidirectionnelle
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select_bidirectional" ON public.contacts;
CREATE POLICY "contacts_select_bidirectional"
ON public.contacts
FOR SELECT
USING (auth.uid() = owner_id OR auth.uid() = contact_user_id);

-- B. Améliorer la RPC pour renvoyer l'état complet
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
  v_contact_exists boolean := false;
  v_request_row jsonb;
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
    -- Tenter de trouver une demande déjà traitée
    SELECT id, from_user_id, to_user_id, status
      INTO v_request_id, v_from_user, v_to_user, v_status
    FROM public.requests
    WHERE from_user_id = p_from_user_id
      AND to_user_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_request_id IS NULL THEN
      RAISE EXCEPTION 'Aucune demande de cet utilisateur';
    ELSE
      -- Déjà traitée, renvoyer l'état actuel
      SELECT to_jsonb(r.*) INTO v_request_row FROM public.requests r WHERE r.id = v_request_id;
      SELECT EXISTS(
        SELECT 1 FROM public.contacts
        WHERE (owner_id = v_from_user AND contact_user_id = v_to_user)
           OR (owner_id = v_to_user AND contact_user_id = v_from_user)
      ) INTO v_contact_exists;
      
      RETURN jsonb_build_object(
        'ok', true,
        'request', v_request_row,
        'contact_created', v_contact_exists,
        'already_processed', true
      );
    END IF;
  END IF;

  -- Accepter la demande
  UPDATE public.requests
  SET status = 'accepted', updated_at = now()
  WHERE id = v_request_id;

  -- Créer les contacts bidirectionnels (sans pair_key car générée)
  INSERT INTO public.contacts (owner_id, contact_user_id, created_at, updated_at)
  VALUES (v_from_user, v_to_user, now(), now())
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  INSERT INTO public.contacts (owner_id, contact_user_id, created_at, updated_at)
  VALUES (v_to_user, v_from_user, now(), now())
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- Créer les notifications
  INSERT INTO public.notifications (user_id, type, message, actor_user_id, created_at)
  VALUES 
    (v_to_user, 'connection_accepted', 'a accepté votre demande de connexion', v_from_user, now()),
    (v_from_user, 'connection_accepted', 'Vous êtes maintenant connectés', v_to_user, now())
  ON CONFLICT DO NOTHING;

  -- Vérifier que le contact existe
  SELECT EXISTS(
    SELECT 1 FROM public.contacts
    WHERE (owner_id = v_from_user AND contact_user_id = v_to_user)
       OR (owner_id = v_to_user AND contact_user_id = v_from_user)
  ) INTO v_contact_exists;

  -- Renvoyer la ligne mise à jour
  SELECT to_jsonb(r.*) INTO v_request_row FROM public.requests r WHERE r.id = v_request_id;

  RETURN jsonb_build_object(
    'ok', true,
    'request', v_request_row,
    'contact_created', v_contact_exists,
    'already_processed', false
  );

EXCEPTION
  WHEN unique_violation THEN
    SELECT to_jsonb(r.*) INTO v_request_row FROM public.requests r WHERE r.id = v_request_id;
    RETURN jsonb_build_object('ok', true, 'request', v_request_row, 'note', 'contact déjà existant');
END;
$$;

-- Recharger PostgREST
NOTIFY pgrst, 'reload schema';