-- Fix the trigger to handle INSERT operations where OLD record doesn't exist
CREATE OR REPLACE FUNCTION public.notify_contacts_on_profile_preferences_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  contact_record RECORD;
BEGIN
  -- Only trigger on UPDATE operations where preferences actually changed
  IF TG_OP = 'UPDATE' THEN
    -- Vérifie si les préférences globales ou d'occasions ont été mises à jour
    IF OLD.global_preferences IS DISTINCT FROM NEW.global_preferences 
       OR OLD.occasion_prefs IS DISTINCT FROM NEW.occasion_prefs THEN
      
      -- Notifie tous les contacts de cet utilisateur
      FOR contact_record IN 
        SELECT DISTINCT owner_id 
        FROM contacts 
        WHERE contact_user_id = NEW.user_id
      LOOP
        PERFORM create_notification_with_actor(
          contact_record.owner_id,           -- recipient
          'preferences_updated',             -- type
          'a mis à jour ses préférences',    -- message
          NEW.user_id,                       -- actor_id
          jsonb_build_object(
            'contact_user_id', NEW.user_id
          )
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;