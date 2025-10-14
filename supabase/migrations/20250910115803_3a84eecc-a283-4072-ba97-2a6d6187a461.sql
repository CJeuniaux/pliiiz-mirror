-- Fix make_contacts_on_accept to avoid RLS violation by inserting only for the accepting user (to_user_id)
-- This prevents attempting to insert a contact row owned by someone else (from_user_id), which fails RLS.

CREATE OR REPLACE FUNCTION public.make_contacts_on_accept()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'accepted'
     AND COALESCE(OLD.status,'') <> 'accepted' THEN

    -- Insert a basic contact entry only for the accepting user (to_user_id)
    -- This respects the contacts RLS policy (auth.uid() = user_id)
    INSERT INTO contacts(user_id, first_name, last_name, created_at)
    VALUES (NEW.to_user_id, 'Contact', 'Accepté', now());
  END IF;
  RETURN NEW;
END $$;