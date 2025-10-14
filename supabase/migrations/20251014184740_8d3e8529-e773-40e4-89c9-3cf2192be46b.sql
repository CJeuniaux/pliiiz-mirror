-- Suppression du trigger problématique et recréation avec gestion des doublons
DROP TRIGGER IF EXISTS on_request_accepted ON public.requests;

-- Fonction améliorée qui gère les doublons
CREATE OR REPLACE FUNCTION public.create_bidirectional_contacts_on_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pair_key TEXT;
BEGIN
  -- Uniquement si la demande passe à 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    -- Générer la clé de paire (ordre alphabétique des UUIDs)
    v_pair_key := CASE 
      WHEN NEW.from_user_id::text < NEW.to_user_id::text 
      THEN NEW.from_user_id::text || '_' || NEW.to_user_id::text
      ELSE NEW.to_user_id::text || '_' || NEW.from_user_id::text
    END;

    -- Créer les deux contacts (avec ON CONFLICT DO NOTHING pour éviter les doublons)
    INSERT INTO public.contacts (owner_id, contact_user_id, pair_key)
    VALUES 
      (NEW.from_user_id, NEW.to_user_id, v_pair_key),
      (NEW.to_user_id, NEW.from_user_id, v_pair_key)
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

    -- Créer les notifications
    INSERT INTO public.notifications (user_id, type, message, actor_user_id)
    VALUES 
      (NEW.to_user_id, 'connection_accepted', 'a accepté votre demande de connexion', NEW.from_user_id),
      (NEW.from_user_id, 'connection_accepted', 'Vous êtes maintenant connectés', NEW.to_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER on_request_accepted
AFTER UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.create_bidirectional_contacts_on_accept();