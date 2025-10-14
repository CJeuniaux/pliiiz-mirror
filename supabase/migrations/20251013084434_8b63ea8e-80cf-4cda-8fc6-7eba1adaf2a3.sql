-- Fix duplicate key error by ignoring any unique conflicts
CREATE OR REPLACE FUNCTION public.resync_all_contacts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean;
  v_total_accepted int := 0;
  v_contacts_created int := 0;
  r record;
BEGIN
  -- Vérifier si l'utilisateur est admin
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = v_uid AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Accès refusé : cette fonction est réservée aux administrateurs';
  END IF;

  -- Compter toutes les demandes acceptées
  SELECT COUNT(*) INTO v_total_accepted
  FROM requests
  WHERE status = 'accepted';

  -- Créer les contacts manquants pour toutes les demandes acceptées
  FOR r IN 
    SELECT DISTINCT 
      from_user_id, 
      to_user_id,
      created_at
    FROM requests
    WHERE status = 'accepted'
  LOOP
    -- Contact A→B (from_user voit to_user)
    INSERT INTO contacts (owner_id, contact_user_id)
    VALUES (r.from_user_id, r.to_user_id)
    ON CONFLICT DO NOTHING; -- ignore tout conflit unique (ex: pair_key)

    IF FOUND THEN
      v_contacts_created := v_contacts_created + 1;
    END IF;

    -- Contact B→A (to_user voit from_user)
    INSERT INTO contacts (owner_id, contact_user_id)
    VALUES (r.to_user_id, r.from_user_id)
    ON CONFLICT DO NOTHING; -- ignore tout conflit unique (ex: pair_key)

    IF FOUND THEN
      v_contacts_created := v_contacts_created + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'total_accepted_requests', v_total_accepted,
    'contacts_created', v_contacts_created,
    'synced_at', now()
  );
END;
$$;