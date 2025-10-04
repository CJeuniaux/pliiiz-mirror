-- Migration pour centraliser les préférences dans profiles
-- Étape 1: S'assurer que les colonnes existent (déjà présentes selon le schéma)
-- global_preferences et occasion_prefs existent déjà

-- Étape 2: Fonction idempotente de backfill pour migrer les données
CREATE OR REPLACE FUNCTION public.backfill_preferences_to_profiles()
RETURNS TABLE(migrated_count integer, updated_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_migrated_count integer := 0;
  v_updated_count integer := 0;
BEGIN
  -- Migrer les données de preferences vers profiles.global_preferences
  UPDATE profiles p
  SET 
    global_preferences = COALESCE(p.global_preferences, '{}'::jsonb) || jsonb_build_object(
      'likes', COALESCE(pr.likes, '{}'),
      'avoid', COALESCE(pr.dislikes, '{}'), 
      'allergies', COALESCE(pr.allergies, '{}'),
      'giftIdeas', COALESCE(pr.gift_ideas, '{}'),
      'sizes', COALESCE(pr.sizes, '{}')
    ),
    updated_at = now()
  FROM preferences pr
  WHERE pr.user_id = p.user_id
    AND (
      p.global_preferences IS NULL 
      OR p.global_preferences = '{}'::jsonb
      OR NOT (p.global_preferences ? 'likes')
    );

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- Initialiser global_preferences pour les profils qui n'ont pas de données preferences
  UPDATE profiles 
  SET 
    global_preferences = '{"avoid": [], "likes": [], "sizes": {}, "allergies": [], "giftIdeas": []}'::jsonb,
    updated_at = now()
  WHERE global_preferences IS NULL 
    OR global_preferences = '{}'::jsonb;

  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;

  -- Initialiser occasion_prefs si vide
  UPDATE profiles 
  SET 
    occasion_prefs = '{}'::jsonb,
    updated_at = now()
  WHERE occasion_prefs IS NULL;

  RETURN QUERY SELECT v_migrated_count, v_updated_count;
END;
$$;

-- Exécuter le backfill
SELECT * FROM public.backfill_preferences_to_profiles();

-- Fonction pour s'assurer que les préférences sont initialisées (guard)
CREATE OR REPLACE FUNCTION public.ensure_profile_preferences_initialized()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- S'assurer que global_preferences est initialisé
  IF NEW.global_preferences IS NULL OR NEW.global_preferences = '{}'::jsonb THEN
    NEW.global_preferences := '{"avoid": [], "likes": [], "sizes": {}, "allergies": [], "giftIdeas": []}'::jsonb;
  END IF;

  -- S'assurer que occasion_prefs est initialisé
  IF NEW.occasion_prefs IS NULL THEN
    NEW.occasion_prefs := '{}'::jsonb;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger pour s'assurer de l'initialisation
DROP TRIGGER IF EXISTS ensure_profile_preferences_on_insert ON profiles;
CREATE TRIGGER ensure_profile_preferences_on_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_preferences_initialized();

DROP TRIGGER IF EXISTS ensure_profile_preferences_on_update ON profiles;
CREATE TRIGGER ensure_profile_preferences_on_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_preferences_initialized();