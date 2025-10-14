-- ============================================
-- MIGRATION: Réparation complète des contacts
-- ============================================

-- 1) Index unique: pas de doublon contact (owner_id, contact_user_id)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_contacts_pair
  ON public.contacts(owner_id, contact_user_id);

-- 2) Index unique: une seule request pending par paire et par sens
CREATE UNIQUE INDEX IF NOT EXISTS uniq_requests_pair_pending
  ON public.requests(from_user_id, to_user_id)
  WHERE status = 'pending';

-- 3) Trigger: quand une request passe à 'accepted', créer les 2 lignes contacts (A->B et B->A)
CREATE OR REPLACE FUNCTION public.fn_create_contacts_on_accept()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Créer contact A->B (from voit to)
    INSERT INTO public.contacts(owner_id, contact_user_id, created_at)
    VALUES (NEW.from_user_id, NEW.to_user_id, COALESCE(NEW.updated_at, now()))
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

    -- Créer contact B->A (to voit from)
    INSERT INTO public.contacts(owner_id, contact_user_id, created_at)
    VALUES (NEW.to_user_id, NEW.from_user_id, COALESCE(NEW.updated_at, now()))
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_contacts_on_accept ON public.requests;
CREATE TRIGGER trg_create_contacts_on_accept
AFTER INSERT OR UPDATE OF status ON public.requests
FOR EACH ROW 
EXECUTE FUNCTION public.fn_create_contacts_on_accept();

-- 4) RPC admin: resynchroniser TOUT (rétroactif) - retourne des stats JSON
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
  SELECT r.from_user_id, r.to_user_id, COALESCE(r.updated_at, r.created_at, now())
  FROM public.requests r
  WHERE r.status = 'accepted'
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

  -- Sens B -> A (to_user voit from_user)
  INSERT INTO public.contacts(owner_id, contact_user_id, created_at)
  SELECT r.to_user_id, r.from_user_id, COALESCE(r.updated_at, r.created_at, now())
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

-- 5) Supprimer et recréer la vue diagnostic proprement
DROP VIEW IF EXISTS public.vw_missing_contacts CASCADE;

CREATE VIEW public.vw_missing_contacts AS
WITH accepted_requests AS (
  SELECT DISTINCT from_user_id, to_user_id, created_at, id
  FROM requests 
  WHERE status = 'accepted'
),
all_expected_pairs AS (
  -- Sens A->B
  SELECT from_user_id AS owner_id, to_user_id AS contact_user_id, created_at, id AS request_id
  FROM accepted_requests
  UNION ALL
  -- Sens B->A
  SELECT to_user_id AS owner_id, from_user_id AS contact_user_id, created_at, id AS request_id
  FROM accepted_requests
)
SELECT 
  ep.request_id,
  ep.owner_id AS from_user_id,
  ep.contact_user_id AS to_user_id,
  ep.created_at AS request_created_at,
  (c.id IS NOT NULL) AS has_contact
FROM all_expected_pairs ep
LEFT JOIN contacts c ON c.owner_id = ep.owner_id AND c.contact_user_id = ep.contact_user_id
WHERE c.id IS NULL;

COMMENT ON VIEW public.vw_missing_contacts IS 'Liste les demandes acceptées qui n''ont pas encore leurs contacts créés';