-- Fix integer → jsonb cast issue in safe_upsert_profile by using to_jsonb
CREATE OR REPLACE FUNCTION public.safe_upsert_profile(p_user_id uuid, p_updates jsonb)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_likes text[];
  v_dislikes text[];
  v_allergies text[];
  v_current_wants text[];
  v_gift_ideas text[];
  v_sizes jsonb;
  v_next_version int := 1;
BEGIN
  -- Valider et nettoyer les dates
  IF p_updates ? 'birthday' AND p_updates->>'birthday' = '' THEN
    p_updates := p_updates - 'birthday';
  END IF;
  
  -- Gérer les versions dans global_preferences (use to_jsonb instead of ::jsonb cast)
  IF p_updates ? 'global_preferences' THEN
    SELECT COALESCE((global_preferences->>'_version')::int, 0) + 1
      INTO v_next_version
    FROM profiles
    WHERE user_id = p_user_id;

    p_updates := jsonb_set(
      p_updates,
      '{global_preferences,_version}',
      to_jsonb(v_next_version)
    );
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
    COALESCE(p_updates->>'first_name', 'Utilisateur'),
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
    COALESCE(p_updates->'global_preferences', '{"avoid": [], "likes": [], "sizes": {}, "allergies": [], "giftIdeas": [], "_version": 1}'::jsonb),
    COALESCE(p_updates->'occasion_prefs', '{}'::jsonb),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = CASE 
      WHEN EXCLUDED.first_name IS NOT NULL THEN EXCLUDED.first_name 
      ELSE profiles.first_name 
    END,
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