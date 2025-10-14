-- Helper: normaliser un statut
CREATE OR REPLACE FUNCTION public._norm_status(p anyelement)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT lower(p::text) $$;

-- RLS lecture contacts bidirectionnelle
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_refresh_select" ON public.contacts;
CREATE POLICY "contacts_refresh_select"
ON public.contacts
FOR SELECT
USING (auth.uid() = owner_id OR auth.uid() = contact_user_id);

-- ✅ RPC: retourne (pending + contacts) pour l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_contacts_and_pending()
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

  -- Contacts bidirectionnels
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
    'pending', v_pending, 
    'contacts', v_contacts,
    'pending_count', jsonb_array_length(v_pending),
    'contacts_count', jsonb_array_length(v_contacts)
  );
END $$;

REVOKE ALL ON FUNCTION public.get_contacts_and_pending() FROM public;
GRANT EXECUTE ON FUNCTION public.get_contacts_and_pending() TO authenticated;

-- Recharger PostgREST
NOTIFY pgrst, 'reload schema';