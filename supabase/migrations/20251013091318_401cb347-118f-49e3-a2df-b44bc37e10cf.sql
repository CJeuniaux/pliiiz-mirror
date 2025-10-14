-- Correction de la fonction resync_all_contacts - la table requests n'a pas de colonne updated_at
CREATE OR REPLACE FUNCTION public.resync_all_contacts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_has_admin boolean := EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_uid AND role = 'admin'
  );
  v_is_service boolean := current_setting('role', true) = 'service_role';
  v_is_dashboard boolean := current_user IN ('postgres', 'supabase_admin');
  v_is_admin boolean := COALESCE(v_has_admin, false) OR v_is_service OR v_is_dashboard;
  v_total_accepted int := 0;
  v_contacts_created int := 0;
  v_before_count int := 0;
  v_after_count int := 0;
BEGIN
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Accès refusé : cette fonction est réservée aux administrateurs';
  END IF;

  -- Compter les demandes acceptées
  SELECT COUNT(*) INTO v_total_accepted
  FROM requests
  WHERE status = 'accepted';

  -- Compter les contacts avant
  SELECT COUNT(*) INTO v_before_count FROM contacts;

  -- Sens A -> B (from_user voit to_user)
  INSERT INTO public.contacts(owner_id, contact_user_id, created_at)
  SELECT r.from_user_id, r.to_user_id, COALESCE(r.created_at, now())
  FROM public.requests r
  WHERE r.status = 'accepted'
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- Sens B -> A (to_user voit from_user)
  INSERT INTO public.contacts(owner_id, contact_user_id, created_at)
  SELECT r.to_user_id, r.from_user_id, COALESCE(r.created_at, now())
  FROM public.requests r
  WHERE r.status = 'accepted'
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- Compter les contacts après
  SELECT COUNT(*) INTO v_after_count FROM contacts;
  v_contacts_created := v_after_count - v_before_count;

  RETURN jsonb_build_object(
    'success', true,
    'total_accepted_requests', v_total_accepted,
    'contacts_created', v_contacts_created,
    'contacts_before', v_before_count,
    'contacts_after', v_after_count,
    'synced_at', now()
  );
END;
$$;