-- Mise à jour des triggers pour utiliser la nouvelle fonction avec snapshot

-- Mise à jour du trigger pour l'acceptation de contacts
CREATE OR REPLACE FUNCTION public.make_contacts_on_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP='UPDATE' AND NEW.status='accepted' AND COALESCE(OLD.status,'')<>'accepted' THEN
    -- Crée les contacts bidirectionnels
    INSERT INTO contacts(owner_id, contact_user_id, alias, created_at)
    VALUES (NEW.from_user_id, NEW.to_user_id, NULL, now())
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

    INSERT INTO contacts(owner_id, contact_user_id, alias, created_at)
    VALUES (NEW.to_user_id, NEW.from_user_id, NULL, now())
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
    
    -- Crée la notification avec snapshot acteur
    PERFORM create_notification_with_actor(
      NEW.from_user_id,                    -- recipient
      'contact_accepted',                   -- type
      'a accepté votre demande de contact', -- message
      NEW.to_user_id,                      -- actor_id
      jsonb_build_object(
        'request_id', NEW.id,
        'accepter_user_id', NEW.to_user_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Mise à jour du trigger pour les mises à jour de préférences
CREATE OR REPLACE FUNCTION public.notify_contacts_on_preferences_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contact_record RECORD;
  updated_fields TEXT[];
BEGIN
  -- Vérifie quels champs ont été mis à jour
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

  -- Notifie uniquement si des champs pertinents ont été mis à jour
  IF array_length(updated_fields, 1) > 0 THEN
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
          'contact_user_id', NEW.user_id,
          'updated_fields', updated_fields
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Mise à jour du trigger pour les mises à jour de profils
CREATE OR REPLACE FUNCTION public.notify_contacts_on_profile_preferences_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contact_record RECORD;
BEGIN
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

  RETURN NEW;
END;
$$;