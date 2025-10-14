-- 0) RLS: lecture contacts (déjà fait mais on s'assure)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select_bidirectional" ON public.contacts;
CREATE POLICY "contacts_select_bidirectional"
ON public.contacts
FOR SELECT
USING (auth.uid() = owner_id OR auth.uid() = contact_user_id);

-- 1) Helper: normaliser un statut (texte ou enum)
CREATE OR REPLACE FUNCTION public._norm_status(p anyelement)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT lower(p::text) $$;

-- 2) RPC PRINCIPALE : fait TOUT et renvoie ce qu'il faut au front
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
  v_contacts jsonb;
  v_request jsonb;
BEGIN
  -- Verrouiller la demande la plus récente (pending ou autre)
  SELECT id, from_user_id, to_user_id, public._norm_status(status)
    INTO v_request_id, v_from_user, v_to_user, v_status
  FROM public.requests
  WHERE from_user_id = p_from_user_id
    AND to_user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'Aucune demande de cet utilisateur';
  END IF;

  -- Passer en 'accepted' QUEL QUE SOIT l'état (idempotent)
  UPDATE public.requests
  SET status = 'accepted', updated_at = now()
  WHERE id = v_request_id;

  -- Supprimer pendings doublons dans les 2 sens
  DELETE FROM public.requests
  WHERE id <> v_request_id
    AND public._norm_status(status) = 'pending'
    AND (
      (from_user_id = v_from_user AND to_user_id = v_to_user) OR
      (from_user_id = v_to_user AND to_user_id = v_from_user)
    );

  -- Créer les contacts bidirectionnels (idempotent)
  -- Contact 1: from_user possède to_user
  INSERT INTO public.contacts (owner_id, contact_user_id, created_at, updated_at)
  VALUES (v_from_user, v_to_user, now(), now())
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- Contact 2: to_user possède from_user  
  INSERT INTO public.contacts (owner_id, contact_user_id, created_at, updated_at)
  VALUES (v_to_user, v_from_user, now(), now())
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- Créer les notifications
  INSERT INTO public.notifications (user_id, type, message, actor_user_id, created_at)
  VALUES 
    (v_to_user, 'connection_accepted', 'a accepté votre demande de connexion', v_from_user, now()),
    (v_from_user, 'connection_accepted', 'Vous êtes maintenant connectés', v_to_user, now())
  ON CONFLICT DO NOTHING;

  -- Renvoyer les contacts créés (visibles par RLS)
  SELECT jsonb_agg(to_jsonb(c.*)) INTO v_contacts
  FROM public.contacts c
  WHERE (c.owner_id = v_from_user AND c.contact_user_id = v_to_user)
     OR (c.owner_id = v_to_user AND c.contact_user_id = v_from_user);

  -- Renvoyer la demande mise à jour
  SELECT to_jsonb(r.*) INTO v_request 
  FROM public.requests r 
  WHERE r.id = v_request_id;

  RETURN jsonb_build_object(
    'ok', true,
    'request', v_request,
    'contacts', COALESCE(v_contacts, '[]'::jsonb),
    'contact_count', jsonb_array_length(COALESCE(v_contacts, '[]'::jsonb))
  );

EXCEPTION
  WHEN unique_violation THEN
    SELECT to_jsonb(r.*) INTO v_request 
    FROM public.requests r 
    WHERE r.id = v_request_id;
    
    RETURN jsonb_build_object(
      'ok', true, 
      'request', v_request,
      'note', 'contact déjà existant'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_request_by_user(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_request_by_user(uuid) TO authenticated;

-- 3) Recharger l'API
NOTIFY pgrst, 'reload schema';