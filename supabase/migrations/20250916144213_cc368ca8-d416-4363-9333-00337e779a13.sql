-- Corriger les problèmes de sauvegarde des données utilisateurs

-- 1. Nettoyer les doublons existants dans profiles (garder le plus récent)
WITH ranked_profiles AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) as rn
  FROM profiles
),
profiles_to_delete AS (
  SELECT id FROM ranked_profiles WHERE rn > 1
)
DELETE FROM profiles WHERE id IN (SELECT id FROM profiles_to_delete);

-- 2. Nettoyer les doublons existants dans preferences (garder le plus récent)
WITH ranked_preferences AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) as rn
  FROM preferences
),
preferences_to_delete AS (
  SELECT id FROM ranked_preferences WHERE rn > 1
)
DELETE FROM preferences WHERE id IN (SELECT id FROM preferences_to_delete);

-- 3. Ajouter les contraintes uniques manquantes
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

ALTER TABLE preferences 
ADD CONSTRAINT preferences_user_id_unique UNIQUE (user_id);

-- 4. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);

-- 5. Fonction helper pour gérer les upserts sécurisés de profils
CREATE OR REPLACE FUNCTION public.safe_upsert_profile(
  p_user_id UUID,
  p_updates JSONB
) RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Valider et nettoyer les dates
  IF p_updates ? 'birthday' AND p_updates->>'birthday' = '' THEN
    p_updates := p_updates - 'birthday';
  END IF;
  
  -- Upsert sécurisé avec gestion des erreurs
  RETURN QUERY
  INSERT INTO profiles (
    user_id,
    first_name,
    last_name,
    email,
    birthday,
    city,
    country,
    regift_enabled,
    regift_note,
    avatar_url,
    bio,
    display_name,
    language,
    email_verified,
    global_preferences,
    occasion_prefs,
    updated_at
  )
  VALUES (
    p_user_id,
    COALESCE(p_updates->>'first_name', ''),
    p_updates->>'last_name',
    p_updates->>'email',
    CASE 
      WHEN p_updates->>'birthday' IS NOT NULL AND p_updates->>'birthday' != '' 
      THEN (p_updates->>'birthday')::date 
      ELSE NULL 
    END,
    p_updates->>'city',
    p_updates->>'country',
    COALESCE((p_updates->>'regift_enabled')::boolean, false),
    p_updates->>'regift_note',
    p_updates->>'avatar_url',
    p_updates->>'bio',
    p_updates->>'display_name',
    COALESCE(p_updates->>'language', 'fr'),
    COALESCE((p_updates->>'email_verified')::boolean, false),
    COALESCE(p_updates->'global_preferences', '{"avoid": [], "likes": [], "sizes": {}, "allergies": [], "giftIdeas": []}'::jsonb),
    COALESCE(p_updates->'occasion_prefs', '{}'::jsonb),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    birthday = COALESCE(EXCLUDED.birthday, profiles.birthday),
    city = COALESCE(EXCLUDED.city, profiles.city),
    country = COALESCE(EXCLUDED.country, profiles.country),
    regift_enabled = COALESCE(EXCLUDED.regift_enabled, profiles.regift_enabled),
    regift_note = COALESCE(EXCLUDED.regift_note, profiles.regift_note),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    bio = COALESCE(EXCLUDED.bio, profiles.bio),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    language = COALESCE(EXCLUDED.language, profiles.language),
    email_verified = COALESCE(EXCLUDED.email_verified, profiles.email_verified),
    global_preferences = COALESCE(EXCLUDED.global_preferences, profiles.global_preferences),
    occasion_prefs = COALESCE(EXCLUDED.occasion_prefs, profiles.occasion_prefs),
    updated_at = now()
  RETURNING *;
END;
$$;

-- 6. Fonction helper pour gérer les upserts sécurisés de préférences
CREATE OR REPLACE FUNCTION public.safe_upsert_preferences(
  p_user_id UUID,
  p_updates JSONB
) RETURNS SETOF preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO preferences (
    user_id,
    likes,
    dislikes,
    allergies,
    current_wants,
    gift_ideas,
    sizes,
    updated_at
  )
  VALUES (
    p_user_id,
    COALESCE(p_updates->'likes', '[]'::jsonb)::text[],
    COALESCE(p_updates->'dislikes', '[]'::jsonb)::text[],
    COALESCE(p_updates->'allergies', '[]'::jsonb)::text[],
    COALESCE(p_updates->'current_wants', '[]'::jsonb)::text[],
    COALESCE(p_updates->'gift_ideas', '[]'::jsonb)::text[],
    COALESCE(p_updates->'sizes', '{}'::jsonb),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    likes = COALESCE(EXCLUDED.likes, preferences.likes),
    dislikes = COALESCE(EXCLUDED.dislikes, preferences.dislikes),
    allergies = COALESCE(EXCLUDED.allergies, preferences.allergies),
    current_wants = COALESCE(EXCLUDED.current_wants, preferences.current_wants),
    gift_ideas = COALESCE(EXCLUDED.gift_ideas, preferences.gift_ideas),
    sizes = COALESCE(EXCLUDED.sizes, preferences.sizes),
    updated_at = now()
  RETURNING *;
END;
$$;