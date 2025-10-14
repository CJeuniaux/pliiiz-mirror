-- Fix: The trigger on preferences table is trying to access global_preferences which doesn't exist
-- This field only exists on the profiles table

-- Drop the incorrect trigger if it exists on preferences
DROP TRIGGER IF EXISTS notify_contacts_on_preferences_update ON preferences;
DROP TRIGGER IF EXISTS notify_contacts_on_profile_update ON preferences;

-- Recreate the correct trigger function for preferences table
CREATE OR REPLACE FUNCTION public.notify_contacts_on_preferences_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contact_record RECORD;
  updated_fields TEXT[];
BEGIN
  -- Only process UPDATE operations (skip INSERT to avoid OLD.* errors)
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Check which fields were updated
  updated_fields := ARRAY[]::TEXT[];
  
  IF OLD.current_wants IS DISTINCT FROM NEW.current_wants THEN
    updated_fields := array_append(updated_fields, 'idées cadeaux');
  END IF;
  
  IF OLD.likes IS DISTINCT FROM NEW.likes THEN
    updated_fields := array_append(updated_fields, 'préférences');
  END IF;
  
  IF OLD.dislikes IS DISTINCT FROM NEW.dislikes THEN
    updated_fields := array_append(updated_fields, 'choses à éviter');
  END IF;
  
  IF OLD.gift_ideas IS DISTINCT FROM NEW.gift_ideas THEN
    updated_fields := array_append(updated_fields, 'suggestions de cadeaux');
  END IF;

  -- Notify only if relevant fields changed
  IF array_length(updated_fields, 1) > 0 THEN
    FOR contact_record IN 
      SELECT DISTINCT owner_id 
      FROM contacts 
      WHERE contact_user_id = NEW.user_id
    LOOP
      PERFORM create_notification_with_actor(
        contact_record.owner_id,
        'preferences_updated',
        'a mis à jour ses préférences',
        NEW.user_id,
        jsonb_build_object(
          'contact_user_id', NEW.user_id,
          'updated_fields', updated_fields
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to preferences table (INSERT + UPDATE)
CREATE TRIGGER notify_contacts_on_preferences_update
  AFTER INSERT OR UPDATE ON preferences
  FOR EACH ROW
  EXECUTE FUNCTION notify_contacts_on_preferences_update();

-- Ensure the profiles trigger exists and is correct
CREATE OR REPLACE FUNCTION public.notify_contacts_on_profile_preferences_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contact_record RECORD;
BEGIN
  -- Only trigger on UPDATE operations where preferences actually changed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.global_preferences IS DISTINCT FROM NEW.global_preferences 
       OR OLD.occasion_prefs IS DISTINCT FROM NEW.occasion_prefs THEN
      
      FOR contact_record IN 
        SELECT DISTINCT owner_id 
        FROM contacts 
        WHERE contact_user_id = NEW.user_id
      LOOP
        PERFORM create_notification_with_actor(
          contact_record.owner_id,
          'preferences_updated',
          'a mis à jour ses préférences',
          NEW.user_id,
          jsonb_build_object(
            'contact_user_id', NEW.user_id
          )
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger on profiles (only UPDATE, not INSERT)
DROP TRIGGER IF EXISTS notify_contacts_on_profile_preferences_update ON profiles;
CREATE TRIGGER notify_contacts_on_profile_preferences_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_contacts_on_profile_preferences_update();