-- Migration: Corriger les contacts manquants et ajouter des garde-fous

-- 1) Index d'unicité pour éviter les doublons de contacts
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique_pair 
  ON public.contacts (owner_id, contact_user_id);

-- 2) Index pour une seule demande pending par paire
CREATE UNIQUE INDEX IF NOT EXISTS idx_requests_pending_unique
  ON public.requests (from_user_id, to_user_id) 
  WHERE status = 'pending';

-- 3) Fonction trigger : créer automatiquement les contacts à l'acceptation
CREATE OR REPLACE FUNCTION public.create_contacts_on_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si la demande est acceptée, créer les contacts bidirectionnels
  IF NEW.status = 'accepted' THEN
    -- Contact A -> B
    INSERT INTO public.contacts (owner_id, contact_user_id, created_at)
    VALUES (NEW.from_user_id, NEW.to_user_id, COALESCE(NEW.updated_at, now()))
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
    
    -- Contact B -> A
    INSERT INTO public.contacts (owner_id, contact_user_id, created_at)
    VALUES (NEW.to_user_id, NEW.from_user_id, COALESCE(NEW.updated_at, now()))
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4) Trigger sur la table requests
DROP TRIGGER IF EXISTS trigger_create_contacts_on_accept ON public.requests;
CREATE TRIGGER trigger_create_contacts_on_accept
  AFTER INSERT OR UPDATE OF status ON public.requests
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_contacts_on_accept();

-- 5) Fonction RPC : resynchroniser toutes les demandes acceptées
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
BEGIN
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

-- 6) Vue de diagnostic : demandes acceptées sans contact
CREATE OR REPLACE VIEW public.vw_missing_contacts AS
WITH accepted_requests AS (
  SELECT id, from_user_id, to_user_id, created_at
  FROM public.requests
  WHERE status = 'accepted'
)
SELECT 
  ar.id as request_id,
  ar.from_user_id,
  ar.to_user_id,
  ar.created_at as request_created_at,
  CASE 
    WHEN c1.id IS NULL THEN false 
    ELSE true 
  END as has_contact_ab,
  CASE 
    WHEN c2.id IS NULL THEN false 
    ELSE true 
  END as has_contact_ba
FROM accepted_requests ar
LEFT JOIN public.contacts c1 
  ON c1.owner_id = ar.from_user_id 
  AND c1.contact_user_id = ar.to_user_id
LEFT JOIN public.contacts c2 
  ON c2.owner_id = ar.to_user_id 
  AND c2.contact_user_id = ar.from_user_id
WHERE c1.id IS NULL OR c2.id IS NULL;