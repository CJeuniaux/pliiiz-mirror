-- Create/repair trigger to create contacts when a request is accepted
DO $$
BEGIN
  -- Drop existing trigger if present to avoid duplicates
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_make_contacts_on_accept'
  ) THEN
    DROP TRIGGER trg_make_contacts_on_accept ON public.requests;
  END IF;
END $$;

CREATE TRIGGER trg_make_contacts_on_accept
AFTER UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.make_contacts_on_accept();

-- Backfill: ensure all already-accepted requests have contacts in both directions
INSERT INTO public.contacts (owner_id, contact_user_id, alias)
SELECT r.from_user_id, r.to_user_id, NULL
FROM public.requests r
LEFT JOIN public.contacts c 
  ON c.owner_id = r.from_user_id AND c.contact_user_id = r.to_user_id
WHERE r.status = 'accepted' AND c.owner_id IS NULL;

INSERT INTO public.contacts (owner_id, contact_user_id, alias)
SELECT r.to_user_id, r.from_user_id, NULL
FROM public.requests r
LEFT JOIN public.contacts c 
  ON c.owner_id = r.to_user_id AND c.contact_user_id = r.from_user_id
WHERE r.status = 'accepted' AND c.owner_id IS NULL;