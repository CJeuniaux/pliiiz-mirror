-- ========= PHASE 0 : helpers sûrs =========
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

-- RLS lecture 'contacts'
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_v2_select" ON public.contacts;
CREATE POLICY "contacts_v2_select"
ON public.contacts 
FOR SELECT
USING (owner_id = auth.uid() OR contact_user_id = auth.uid());

-- ========= PHASE 1 : suppression des fonctions connues problématiques =========
DROP FUNCTION IF EXISTS public.accept_connection(uuid);
DROP FUNCTION IF EXISTS public.accept_connection_by_user(uuid);
DROP FUNCTION IF EXISTS public.accept_and_fetch(uuid);
DROP FUNCTION IF EXISTS public.force_accept_and_fetch(uuid);
DROP FUNCTION IF EXISTS public.get_contacts_and_pending();
DROP FUNCTION IF EXISTS public._lists_for_me();

-- ========= PHASE 2 : RPC sûres (ne JAMAIS insérer pair_key si GENERATED) =========
-- Utilitaire : détecte si contacts.pair_key est GENERATED ALWAYS
CREATE OR REPLACE FUNCTION public._contacts_pairkey_is_generated()
RETURNS boolean 
LANGUAGE sql 
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_generated = 'ALWAYS'
     FROM information_schema.columns
     WHERE table_schema='public' AND table_name='contacts' AND column_name='pair_key'),
    false
  );
$$;

-- RPC bas niveau : accepte par request_id, crée le contact sans pair_key si generated
CREATE OR REPLACE FUNCTION public.accept_request(p_request_id uuid)
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_from uuid; 
  v_to uuid; 
  v_status text;
BEGIN
  SELECT from_user_id, to_user_id, public._norm_status(status)
  INTO v_from, v_to, v_status
  FROM public.requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_to IS NULL THEN
    RAISE EXCEPTION 'Demande introuvable (id=%)', p_request_id;
  END IF;
  
  IF v_to <> auth.uid() THEN
    RAISE EXCEPTION 'Cette demande ne vous appartient pas (to_user_id=%)', v_to;
  END IF;

  UPDATE public.requests 
  SET status = 'accepted', updated_at = now() 
  WHERE id = p_request_id;

  -- Créer le contact sans jamais toucher pair_key si GENERATED
  IF public._contacts_pairkey_is_generated() THEN
    INSERT INTO public.contacts (owner_id, contact_user_id)
    VALUES (v_to, v_from)
    ON CONFLICT (pair_key) DO NOTHING;
  ELSE
    INSERT INTO public.contacts (owner_id, contact_user_id, pair_key)
    VALUES (v_to, v_from, public._contact_pair_key(v_from, v_to))
    ON CONFLICT (pair_key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.accept_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_request(uuid) TO authenticated;

-- RPC par from_user_id (inratable pour l'UI)
CREATE OR REPLACE FUNCTION public.accept_request_by_user(p_from_user_id uuid)
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE 
  v_request_id uuid;
BEGIN
  SELECT id INTO v_request_id
  FROM public.requests
  WHERE from_user_id = p_from_user_id 
    AND to_user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_request_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'note', 'aucune demande');
  END IF;

  RETURN public.accept_request(v_request_id);
END $$;

REVOKE ALL ON FUNCTION public.accept_request_by_user(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_request_by_user(uuid) TO authenticated;

-- RPC finale v2 : accepte + renvoie pending/contacts (nouveau nom anti-cache)
CREATE OR REPLACE FUNCTION public.accept_and_sync_v2(p_from_user_id uuid)
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
  IF v_me IS NULL THEN 
    RAISE EXCEPTION 'Non authentifié'; 
  END IF;

  -- Accepter la demande
  PERFORM 1 FROM public.accept_request_by_user(p_from_user_id);

  -- Récupérer pending
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

  -- Récupérer contacts
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

  RETURN jsonb_build_object(
    'ok', true, 
    'pending', v_pending, 
    'contacts', v_contacts
  );
END $$;

REVOKE ALL ON FUNCTION public.accept_and_sync_v2(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_and_sync_v2(uuid) TO authenticated;

-- Recharge le cache API
NOTIFY pgrst, 'reload schema';