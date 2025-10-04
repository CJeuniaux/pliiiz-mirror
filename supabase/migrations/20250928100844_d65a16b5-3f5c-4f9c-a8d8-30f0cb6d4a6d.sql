-- Fonction pour générer un slug unique
CREATE OR REPLACE FUNCTION public.generate_unique_slug(
  p_first_name text,
  p_last_name text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
  slug_exists boolean;
BEGIN
  -- Créer le slug de base à partir du prénom
  base_slug := lower(regexp_replace(
    COALESCE(p_first_name, 'user'),
    '[^a-z0-9]', '-', 'gi'
  ));
  
  -- Nettoyer les tirets multiples
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- Si le slug est vide ou trop court, utiliser "user"
  IF length(base_slug) < 2 THEN
    base_slug := 'user';
  END IF;
  
  -- Vérifier l'unicité et ajouter un suffixe si nécessaire
  final_slug := base_slug;
  
  LOOP
    -- Vérifier si le slug existe déjà
    SELECT EXISTS(
      SELECT 1 FROM share_links 
      WHERE slug = final_slug 
      AND (p_user_id IS NULL OR user_id != p_user_id)
    ) INTO slug_exists;
    
    -- Si le slug n'existe pas, on peut l'utiliser
    IF NOT slug_exists THEN
      EXIT;
    END IF;
    
    -- Incrémenter le compteur et créer un nouveau slug
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
    
    -- Limite de sécurité pour éviter les boucles infinies
    IF counter > 1000 THEN
      -- Utiliser un identifiant aléatoire en cas de problème
      final_slug := base_slug || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Fonction pour migrer les slugs manquants
CREATE OR REPLACE FUNCTION public.migrate_missing_slugs()
RETURNS TABLE(migrated_count integer, error_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_record RECORD;
  generated_slug text;
  v_migrated_count integer := 0;
  v_error_count integer := 0;
BEGIN
  -- Parcourir tous les profils sans share_links actifs
  FOR profile_record IN 
    SELECT p.user_id, p.first_name, p.last_name
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.user_id = p.user_id AND sl.is_active = true
    )
  LOOP
    BEGIN
      -- Générer un slug unique pour ce profil
      generated_slug := generate_unique_slug(
        profile_record.first_name,
        profile_record.last_name,
        profile_record.user_id
      );
      
      -- Insérer ou mettre à jour le share_link
      INSERT INTO share_links (user_id, slug, is_active)
      VALUES (profile_record.user_id, generated_slug, true)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        slug = EXCLUDED.slug,
        is_active = true,
        updated_at = now();
      
      v_migrated_count := v_migrated_count + 1;
      
    EXCEPTION 
      WHEN OTHERS THEN
        -- En cas d'erreur, incrémenter le compteur d'erreurs et continuer
        v_error_count := v_error_count + 1;
        RAISE LOG 'Error migrating slug for user %: %', profile_record.user_id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_migrated_count, v_error_count;
END;
$$;

-- Ajouter un index unique sur les slugs pour garantir l'unicité
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_slug_unique 
ON share_links(slug) 
WHERE is_active = true;

-- Fonction pour résoudre un slug vers un user_id
CREATE OR REPLACE FUNCTION public.resolve_slug_to_user_id(p_slug text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id
  FROM share_links
  WHERE slug = p_slug 
    AND is_active = true
  LIMIT 1;
$$;