-- Ajout pair_key + nettoyage doublons + triggers fusion demandes

-- 1. Ajouter pair_key à requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'pair_key'
  ) THEN
    ALTER TABLE public.requests 
    ADD COLUMN pair_key text 
    GENERATED ALWAYS AS (
      least(from_user_id::text, to_user_id::text) || '|' || greatest(from_user_id::text, to_user_id::text)
    ) STORED;
  END IF;
END $$;

-- 2. Ajouter pair_key à contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'pair_key'
  ) THEN
    ALTER TABLE public.contacts 
    ADD COLUMN pair_key text 
    GENERATED ALWAYS AS (
      least(owner_id::text, contact_user_id::text) || '|' || greatest(owner_id::text, contact_user_id::text)
    ) STORED;
  END IF;
END $$;

-- 3. Nettoyer doublons requests (garder plus ancien par paire)
DELETE FROM public.requests r1
WHERE EXISTS (
  SELECT 1 FROM public.requests r2
  WHERE r2.pair_key = r1.pair_key
    AND r2.id < r1.id
    AND r2.status IN ('pending', 'accepted')
    AND r1.status IN ('pending', 'accepted')
);

-- 4. Nettoyer doublons contacts (garder plus ancien par paire)
DELETE FROM public.contacts c1
WHERE EXISTS (
  SELECT 1 FROM public.contacts c2
  WHERE c2.pair_key = c1.pair_key AND c2.id < c1.id
);

-- 5. Index unique requests
DROP INDEX IF EXISTS uq_requests_pending_or_accepted;
CREATE UNIQUE INDEX uq_requests_pending_or_accepted
ON public.requests(pair_key)
WHERE status IN ('pending', 'accepted');

-- 6. Index unique contacts
DROP INDEX IF EXISTS uq_contacts_pair;
CREATE UNIQUE INDEX uq_contacts_pair ON public.contacts(pair_key);

-- 7. Trigger création contacts bidirectionnels
CREATE OR REPLACE FUNCTION public.make_contacts_on_accept()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='UPDATE' AND NEW.status='accepted' AND COALESCE(OLD.status,'')<>'accepted' THEN
    INSERT INTO contacts(owner_id, contact_user_id, created_at)
    VALUES (NEW.from_user_id, NEW.to_user_id, now()),
           (NEW.to_user_id, NEW.from_user_id, now())
    ON CONFLICT (pair_key) DO NOTHING;
    
    PERFORM create_notification_with_actor(
      NEW.from_user_id, 'contact_accepted', 
      'a accepté votre demande de contact', NEW.to_user_id,
      jsonb_build_object('request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS make_contacts_on_accept_trigger ON public.requests;
CREATE TRIGGER make_contacts_on_accept_trigger
AFTER UPDATE OF status ON public.requests FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.make_contacts_on_accept();

-- 8. Trigger auto-acceptation demandes croisées
CREATE OR REPLACE FUNCTION public.merge_cross_requests()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE other_req record;
BEGIN
  SELECT * INTO other_req FROM public.requests
  WHERE pair_key = NEW.pair_key AND id <> NEW.id AND status = 'pending'
  ORDER BY created_at ASC LIMIT 1;

  IF other_req.id IS NOT NULL THEN
    UPDATE public.requests SET status = 'accepted' WHERE id = other_req.id;
    NEW.status := 'accepted';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_merge_cross_requests ON public.requests;
CREATE TRIGGER trg_merge_cross_requests
BEFORE INSERT ON public.requests FOR EACH ROW
EXECUTE FUNCTION public.merge_cross_requests();

-- 9. Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.requests REPLICA IDENTITY FULL;
ALTER TABLE public.contacts REPLICA IDENTITY FULL;