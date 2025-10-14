-- Create trigger to make contacts on accepted requests (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_make_contacts_on_accept'
  ) THEN
    CREATE TRIGGER trg_make_contacts_on_accept
    AFTER UPDATE ON public.requests
    FOR EACH ROW
    WHEN (NEW.status = 'accepted' AND COALESCE(OLD.status, '') <> 'accepted')
    EXECUTE FUNCTION public.make_contacts_on_accept();
  END IF;
END $$;

-- One-time backfill to ensure contacts exist for already accepted requests
-- Create contacts in both directions if missing
INSERT INTO public.contacts (owner_id, contact_user_id, created_at, updated_at)
SELECT r.from_user_id, r.to_user_id, now(), now()
FROM public.requests r
WHERE r.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.owner_id = r.from_user_id AND c.contact_user_id = r.to_user_id
  );

INSERT INTO public.contacts (owner_id, contact_user_id, created_at, updated_at)
SELECT r.to_user_id, r.from_user_id, now(), now()
FROM public.requests r
WHERE r.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.owner_id = r.to_user_id AND c.contact_user_id = r.from_user_id
  );