-- Update the existing trigger to also create notifications when contact request is accepted
CREATE OR REPLACE FUNCTION public.make_contacts_on_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  accepter_name TEXT;
BEGIN
  IF TG_OP='UPDATE' AND NEW.status='accepted' AND COALESCE(OLD.status,'')<>'accepted' THEN
    -- Create contact for the requester
    INSERT INTO contacts(owner_id, contact_user_id, alias, created_at)
    VALUES (NEW.from_user_id, NEW.to_user_id, NULL, now())
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

    -- Create contact for the accepter
    INSERT INTO contacts(owner_id, contact_user_id, alias, created_at)
    VALUES (NEW.to_user_id, NEW.from_user_id, NULL, now())
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
    
    -- Get the accepter's display name
    SELECT COALESCE(first_name || ' ' || COALESCE(last_name, ''), 'Quelqu\'un') 
    INTO accepter_name
    FROM profiles 
    WHERE user_id = NEW.to_user_id;
    
    -- Create notification for the person who made the request
    INSERT INTO notifications (
      user_id,
      type,
      message,
      actor_user_id,
      payload
    ) VALUES (
      NEW.from_user_id,
      'contact_accepted',
      accepter_name || ' a accepté votre demande de contact',
      NEW.to_user_id,
      jsonb_build_object(
        'request_id', NEW.id,
        'accepter_user_id', NEW.to_user_id,
        'accepter_name', accepter_name
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;