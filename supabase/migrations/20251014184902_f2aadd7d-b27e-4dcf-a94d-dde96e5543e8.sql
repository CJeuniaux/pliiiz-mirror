-- Fix: pair_key est probablement une colonne générée -> ne pas l'insérer explicitement
CREATE OR REPLACE FUNCTION public.create_bidirectional_contacts_on_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    -- Insère uniquement owner_id et contact_user_id ; pair_key sera généré par la DB
    INSERT INTO public.contacts (owner_id, contact_user_id)
    VALUES 
      (NEW.from_user_id, NEW.to_user_id),
      (NEW.to_user_id, NEW.from_user_id)
    ON CONFLICT DO NOTHING; -- évite les doublons sur contraintes uniques existantes

    -- Notifications idempotentes
    INSERT INTO public.notifications (user_id, type, message, actor_user_id)
    VALUES 
      (NEW.to_user_id, 'connection_accepted', 'a accepté votre demande de connexion', NEW.from_user_id),
      (NEW.from_user_id, 'connection_accepted', 'Vous êtes maintenant connectés', NEW.to_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;