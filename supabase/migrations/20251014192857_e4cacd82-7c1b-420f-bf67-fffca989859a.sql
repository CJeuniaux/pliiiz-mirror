-- RLS lecture contacts (déjà fait mais on s'assure)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select_bidirectional" ON public.contacts;
CREATE POLICY "contacts_select_bidirectional"
ON public.contacts
FOR SELECT
USING (auth.uid() = owner_id OR auth.uid() = contact_user_id);

-- Vue pratique pour l'app : mes contacts avec l'autre user_id
CREATE OR REPLACE VIEW public.my_contacts AS
SELECT
  CASE WHEN owner_id = auth.uid() THEN contact_user_id ELSE owner_id END AS other_user_id,
  owner_id,
  contact_user_id,
  created_at
FROM public.contacts
WHERE owner_id = auth.uid() OR contact_user_id = auth.uid();

-- RPC atomique : accepte + crée contacts bidirectionnels + supprime doublons pendings
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
  v_contact_exists boolean;
BEGIN
  -- 1) Récupérer et locker la demande principale
  SELECT id, from_user_id, to_user_id, status
    INTO v_request_id, v_from_user, v_to_user, v_status
  FROM public.requests
  WHERE from_user_id = p_from_user_id
    AND to_user_id = auth.uid()
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  -- Si aucune demande pending, vérifier si déjà traitée
  IF v_request_id IS NULL THEN
    -- Chercher une demande déjà acceptée (idempotence)
    SELECT id, from_user_id, to_user_id, status
      INTO v_request_id, v_from_user, v_to_user, v_status
    FROM public.requests
    WHERE from_user_id = p_from_user_id
      AND to_user_id = auth.uid()
      AND status = 'accepted'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_request_id IS NOT NULL THEN
      -- Vérifier si le contact existe
      SELECT EXISTS(
        SELECT 1 FROM public.contacts
        WHERE (owner_id = v_from_user AND contact_user_id = v_to_user)
           OR (owner_id = v_to_user AND contact_user_id = v_from_user)
      ) INTO v_contact_exists;
      
      RETURN jsonb_build_object(
        'ok', true,
        'request_id', v_request_id,
        'contact_created', v_contact_exists,
        'already_processed', true
      );
    END IF;

    RAISE EXCEPTION 'Aucune demande de cet utilisateur';
  END IF;

  -- 2) Accepter la demande
  UPDATE public.requests
  SET status = 'accepted', updated_at = now()
  WHERE id = v_request_id;

  -- 3) NETTOYAGE : Supprimer toutes les AUTRES demandes pending entre cette paire (bidirectionnel)
  DELETE FROM public.requests
  WHERE id <> v_request_id
    AND status = 'pending'
    AND (
      (from_user_id = v_from_user AND to_user_id = v_to_user) OR
      (from_user_id = v_to_user AND to_user_id = v_from_user)
    );

  -- 4) Créer les contacts bidirectionnels (idempotent)
  -- Contact 1: from_user possède to_user
  INSERT INTO public.contacts (owner_id, contact_user_id, created_at, updated_at)
  VALUES (v_from_user, v_to_user, now(), now())
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- Contact 2: to_user possède from_user  
  INSERT INTO public.contacts (owner_id, contact_user_id, created_at, updated_at)
  VALUES (v_to_user, v_from_user, now(), now())
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- 5) Créer les notifications
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

  RETURN jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'contact_created', v_contact_exists,
    'already_processed', false,
    'duplicates_cleaned', true
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'ok', true, 
      'request_id', v_request_id, 
      'contact_created', true,
      'note', 'contact déjà existant'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_request_by_user(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_request_by_user(uuid) TO authenticated;

-- Recharger PostgREST
NOTIFY pgrst, 'reload schema';