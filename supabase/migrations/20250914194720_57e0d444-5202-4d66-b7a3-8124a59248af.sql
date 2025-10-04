-- Create trigger to notify contacts when user updates preferences/gift ideas
CREATE OR REPLACE FUNCTION public.notify_contacts_on_preferences_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  contact_record RECORD;
  updated_fields TEXT[];
  notification_message TEXT;
  actor_name TEXT;
BEGIN
  -- Get the user's display name
  SELECT COALESCE(first_name || ' ' || COALESCE(last_name, ''), 'Un contact') 
  INTO actor_name
  FROM profiles 
  WHERE user_id = NEW.user_id;

  -- Check what fields were updated
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

  -- Only proceed if relevant fields were updated
  IF array_length(updated_fields, 1) > 0 THEN
    -- Create notification message
    IF array_length(updated_fields, 1) = 1 THEN
      notification_message := actor_name || ' a mis à jour ses ' || updated_fields[1];
    ELSE
      notification_message := actor_name || ' a mis à jour ses préférences';
    END IF;

    -- Notify all contacts of this user
    FOR contact_record IN 
      SELECT DISTINCT owner_id 
      FROM contacts 
      WHERE contact_user_id = NEW.user_id
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        message,
        actor_user_id,
        payload
      ) VALUES (
        contact_record.owner_id,
        'preferences_updated',
        notification_message,
        NEW.user_id,
        jsonb_build_object(
          'contact_user_id', NEW.user_id,
          'updated_fields', updated_fields,
          'contact_name', actor_name
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on preferences table
DROP TRIGGER IF EXISTS notify_preferences_update ON preferences;
CREATE TRIGGER notify_preferences_update
  AFTER UPDATE ON preferences
  FOR EACH ROW
  EXECUTE FUNCTION notify_contacts_on_preferences_update();

-- Also create trigger for global_preferences updates on profiles table
CREATE OR REPLACE FUNCTION public.notify_contacts_on_profile_preferences_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  contact_record RECORD;
  notification_message TEXT;
  actor_name TEXT;
BEGIN
  -- Only trigger if global_preferences or occasion_prefs were updated
  IF OLD.global_preferences IS DISTINCT FROM NEW.global_preferences 
     OR OLD.occasion_prefs IS DISTINCT FROM NEW.occasion_prefs THEN
    
    -- Get the user's display name
    SELECT COALESCE(first_name || ' ' || COALESCE(last_name, ''), 'Un contact') 
    INTO actor_name
    FROM profiles 
    WHERE user_id = NEW.user_id;

    notification_message := actor_name || ' a mis à jour ses préférences';

    -- Notify all contacts of this user
    FOR contact_record IN 
      SELECT DISTINCT owner_id 
      FROM contacts 
      WHERE contact_user_id = NEW.user_id
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        message,
        actor_user_id,
        payload
      ) VALUES (
        contact_record.owner_id,
        'preferences_updated',
        notification_message,
        NEW.user_id,
        jsonb_build_object(
          'contact_user_id', NEW.user_id,
          'contact_name', actor_name
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on profiles table for global preferences
DROP TRIGGER IF EXISTS notify_profile_preferences_update ON profiles;
CREATE TRIGGER notify_profile_preferences_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_contacts_on_profile_preferences_update();