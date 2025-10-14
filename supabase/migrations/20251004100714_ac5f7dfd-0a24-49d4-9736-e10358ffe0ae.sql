-- Fonction pour créer automatiquement un share_link lors de la création d'un profil
CREATE OR REPLACE FUNCTION create_share_link_for_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_slug text;
BEGIN
  -- Générer un slug unique basé sur le prénom, nom et timestamp
  new_slug := lower(
    regexp_replace(
      coalesce(NEW.first_name, '') || '-' || 
      coalesce(NEW.last_name, '') || '-' || 
      substring(md5(random()::text || NEW.user_id::text) from 1 for 8),
      '[^a-z0-9-]', '', 'g'
    )
  );
  
  -- Insérer le share_link avec is_active = true par défaut
  INSERT INTO share_links (user_id, slug, is_active)
  VALUES (NEW.user_id, new_slug, true)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger qui s'exécute après l'insertion d'un profil
DROP TRIGGER IF EXISTS trigger_create_share_link ON profiles;
CREATE TRIGGER trigger_create_share_link
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_share_link_for_profile();

-- Migration pour créer des share_links pour tous les profils existants qui n'en ont pas
DO $$
DECLARE
  profile_record RECORD;
  new_slug text;
BEGIN
  FOR profile_record IN 
    SELECT p.user_id, p.first_name, p.last_name
    FROM profiles p
    LEFT JOIN share_links sl ON p.user_id = sl.user_id
    WHERE sl.user_id IS NULL
  LOOP
    -- Générer un slug unique
    new_slug := lower(
      regexp_replace(
        coalesce(profile_record.first_name, '') || '-' || 
        coalesce(profile_record.last_name, '') || '-' || 
        substring(md5(random()::text || profile_record.user_id::text) from 1 for 8),
        '[^a-z0-9-]', '', 'g'
      )
    );
    
    -- Créer le share_link
    INSERT INTO share_links (user_id, slug, is_active)
    VALUES (profile_record.user_id, new_slug, true)
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;