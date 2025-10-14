-- Protéger la fonction resync_all_contacts pour les admins uniquement

CREATE OR REPLACE FUNCTION public.resync_all_contacts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count_ab INTEGER;
  v_count_ba INTEGER;
  v_total_accepted INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur est admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Compter les demandes acceptées
  SELECT COUNT(*) INTO v_total_accepted
  FROM public.requests
  WHERE status = 'accepted';
  
  -- Créer les contacts manquants (sens A->B)
  WITH inserted AS (
    INSERT INTO public.contacts (owner_id, contact_user_id, created_at)
    SELECT r.from_user_id, r.to_user_id, COALESCE(r.updated_at, now())
    FROM public.requests r
    WHERE r.status = 'accepted'
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING
    RETURNING *
  )
  SELECT COUNT(*) INTO v_count_ab FROM inserted;
  
  -- Créer les contacts manquants (sens B->A)
  WITH inserted AS (
    INSERT INTO public.contacts (owner_id, contact_user_id, created_at)
    SELECT r.to_user_id, r.from_user_id, COALESCE(r.updated_at, now())
    FROM public.requests r
    WHERE r.status = 'accepted'
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING
    RETURNING *
  )
  SELECT COUNT(*) INTO v_count_ba FROM inserted;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_accepted_requests', v_total_accepted,
    'contacts_created', v_count_ab + v_count_ba,
    'synced_at', now()
  );
END;
$$;