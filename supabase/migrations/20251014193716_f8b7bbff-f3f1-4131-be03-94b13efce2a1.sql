-- Helper: normaliser un statut (si pas déjà fait)
CREATE OR REPLACE FUNCTION public._norm_status(p anyelement)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT lower(p::text) $$;

-- ⚡ Nouvelle RPC : accepte via from_user_id ET renvoie pending+contacts à jour
CREATE OR REPLACE FUNCTION public.accept_and_fetch(p_from_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_accept_result jsonb;
  v_pending jsonb;
  v_contacts jsonb;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- 1) Accepter (ou idempotent) en réutilisant la logique robuste existante
  v_accept_result := public.accept_request_by_user(p_from_user_id);

  -- 2) Récupérer la liste des demandes PENDING (to_user = moi), à jour
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'from_user_id', r.from_user_id,
        'to_user_id', r.to_user_id,
        'status', r.status,
        'message', r.message,
        'created_at', r.created_at
      )
      ORDER BY r.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_pending
  FROM public.requests r
  WHERE r.to_user_id = v_me 
    AND public._norm_status(r.status) = 'pending';

  -- 3) Récupérer la liste de mes contacts (bidirectionnel)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'owner_id', c.owner_id,
        'contact_user_id', c.contact_user_id,
        'other_user_id', CASE 
          WHEN c.owner_id = v_me THEN c.contact_user_id 
          ELSE c.owner_id 
        END,
        'created_at', c.created_at
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
    'accept_result', v_accept_result,
    'pending', v_pending,
    'contacts', v_contacts,
    'pending_count', jsonb_array_length(v_pending),
    'contacts_count', jsonb_array_length(v_contacts)
  );
END $$;

REVOKE ALL ON FUNCTION public.accept_and_fetch(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_and_fetch(uuid) TO authenticated;

-- Recharger le cache API
NOTIFY pgrst, 'reload schema';