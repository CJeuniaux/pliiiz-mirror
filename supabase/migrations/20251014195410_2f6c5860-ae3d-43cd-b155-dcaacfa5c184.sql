-- Helpers
CREATE OR REPLACE FUNCTION public._norm_status(p anyelement)
RETURNS text 
LANGUAGE sql 
IMMUTABLE
AS $$ SELECT lower(p::text) $$;

CREATE OR REPLACE FUNCTION public._contact_pair_key(a uuid, b uuid)
RETURNS text 
LANGUAGE sql 
IMMUTABLE
AS $$ SELECT least(a,b)::text || '|' || greatest(a,b)::text; $$;

-- Journal de debug
CREATE TABLE IF NOT EXISTS public.debug_accept_log(
  id bigserial PRIMARY KEY,
  at timestamptz DEFAULT now(),
  actor uuid NOT NULL,
  action text NOT NULL,
  details jsonb
);

GRANT INSERT, SELECT ON public.debug_accept_log TO authenticated;

-- RLS lecture contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_force_select" ON public.contacts;
CREATE POLICY "contacts_force_select"
ON public.contacts
FOR SELECT
USING (owner_id = auth.uid() OR contact_user_id = auth.uid());

-- ⚒️ Normalisation des statuts existants dans requests
UPDATE public.requests
SET status = 'pending'
WHERE public._norm_status(status) = 'pending' AND status <> 'pending';

UPDATE public.requests
SET status = 'accepted'
WHERE public._norm_status(status) = 'accepted' AND status <> 'accepted';

UPDATE public.requests
SET status = 'declined'
WHERE public._norm_status(status) = 'declined' AND status <> 'declined';

-- ⚡ RPC: renvoie la vérité (pending + contacts) pour l'utilisateur courant
CREATE OR REPLACE FUNCTION public._lists_for_me()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_pending jsonb;
  v_contacts jsonb;
BEGIN
  -- Demandes EN ATTENTE où je suis la cible
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'from_user_id', r.from_user_id,
        'to_user_id', r.to_user_id,
        'status', r.status,
        'message', r.message,
        'event_id', r.event_id,
        'created_at', r.created_at,
        'updated_at', r.updated_at
      )
      ORDER BY r.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_pending
  FROM public.requests r
  WHERE r.to_user_id = v_me
    AND public._norm_status(r.status) = 'pending';

  -- Contacts visibles (bidirectionnel)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'owner_id', c.owner_id,
        'contact_user_id', c.contact_user_id,
        'other_user_id', CASE 
          WHEN c.owner_id = v_me THEN c.contact_user_id 
          ELSE c.owner_id 
        END,
        'created_at', c.created_at,
        'updated_at', c.updated_at
      )
      ORDER BY c.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_contacts
  FROM public.contacts c
  WHERE c.owner_id = v_me OR c.contact_user_id = v_me;

  RETURN jsonb_build_object('pending', v_pending, 'contacts', v_contacts);
END $$;

REVOKE ALL ON FUNCTION public._lists_for_me() FROM public;
GRANT EXECUTE ON FUNCTION public._lists_for_me() TO authenticated;

-- 🧨 RPC FINALE : accepte "de force" par from_user_id + log + renvoie pending/contacts
CREATE OR REPLACE FUNCTION public.force_accept_and_fetch(p_from_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_pair text;
  v_req_updated int := 0;
  v_contact_created boolean := false;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Log: début
  INSERT INTO public.debug_accept_log(actor, action, details)
  VALUES (v_me, 'force_accept:start', jsonb_build_object('from_user_id', p_from_user_id));

  -- 1) Met 'accepted' sur TOUTES les demandes entre from_user <-> moi (dans les deux sens)
  UPDATE public.requests
  SET status = 'accepted', updated_at = now()
  WHERE (
    (from_user_id = p_from_user_id AND to_user_id = v_me) OR
    (from_user_id = v_me AND to_user_id = p_from_user_id)
  );
  GET DIAGNOSTICS v_req_updated = ROW_COUNT;

  -- 2) Supprime les doublons 'pending' (si des restes)
  DELETE FROM public.requests
  WHERE public._norm_status(status) = 'pending'
    AND (
      (from_user_id = p_from_user_id AND to_user_id = v_me) OR
      (from_user_id = v_me AND to_user_id = p_from_user_id)
    );

  -- 3) Crée le contact idempotent (bidirectionnel)
  v_pair := public._contact_pair_key(v_me, p_from_user_id);

  INSERT INTO public.contacts (owner_id, contact_user_id, pair_key)
  VALUES (v_me, p_from_user_id, v_pair)
  ON CONFLICT (pair_key) DO NOTHING;
  
  v_contact_created := FOUND;

  -- Si pas créé dans un sens, essayer l'autre sens
  IF NOT v_contact_created THEN
    INSERT INTO public.contacts (owner_id, contact_user_id, pair_key)
    VALUES (p_from_user_id, v_me, v_pair)
    ON CONFLICT (pair_key) DO NOTHING;
    v_contact_created := FOUND;
  END IF;

  -- 4) Log état final
  INSERT INTO public.debug_accept_log(actor, action, details)
  VALUES (
    v_me,
    'force_accept:end',
    jsonb_build_object(
      'from_user_id', p_from_user_id,
      'requests_updated', v_req_updated,
      'contact_created', v_contact_created,
      'lists', public._lists_for_me()
    )
  );

  -- 5) Retourne la vérité (pending + contacts)
  RETURN public._lists_for_me();
END $$;

REVOKE ALL ON FUNCTION public.force_accept_and_fetch(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.force_accept_and_fetch(uuid) TO authenticated;

-- Recharge cache API
NOTIFY pgrst, 'reload schema';