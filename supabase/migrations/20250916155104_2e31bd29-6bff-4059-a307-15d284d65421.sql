-- 2) SAVE PREFERENCES V2 - Améliorer les fonctions existantes
-- Améliorer safe_upsert_profile pour supporter les versions
CREATE OR REPLACE FUNCTION public.safe_upsert_profile(p_user_id uuid, p_updates jsonb)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Valider et nettoyer les dates
  IF p_updates ? 'birthday' AND p_updates->>'birthday' = '' THEN
    p_updates := p_updates - 'birthday';
  END IF;
  
  -- Gérer les versions dans global_preferences
  IF p_updates ? 'global_preferences' THEN
    p_updates := jsonb_set(
      p_updates,
      '{global_preferences,_version}',
      COALESCE(
        (SELECT (global_preferences->>'_version')::int + 1 FROM profiles WHERE user_id = p_user_id),
        '1'
      )::jsonb
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

-- 3) OBSERVABILITÉ - Fonction pour nettoyer les logs de requests anciens
CREATE OR REPLACE FUNCTION public.cleanup_old_request_logs(older_than_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM request_log 
  WHERE created_at < (now() - (older_than_days || ' days')::interval);
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log l'opération
  INSERT INTO app_meta (key, value, updated_at)
  VALUES ('last_request_log_cleanup', deleted_count::text, now())
  ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;
  
  RETURN deleted_count;
END;
$$;

-- Fonction pour obtenir des métriques de santé du système
CREATE OR REPLACE FUNCTION public.get_system_health_metrics()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'recent_signups_24h', (
      SELECT COUNT(*) FROM profiles 
      WHERE created_at > now() - interval '24 hours'
    ),
    'pending_outbox_items', (
      SELECT COUNT(*) FROM replication_outbox 
      WHERE processed_at IS NULL
    ),
    'oldest_pending_outbox', (
      SELECT EXTRACT(EPOCH FROM (now() - MIN(created_at)))::int 
      FROM replication_outbox 
      WHERE processed_at IS NULL
    ),
    'request_log_size', (SELECT COUNT(*) FROM request_log),
    'last_request_log_cleanup', (
      SELECT value FROM app_meta WHERE key = 'last_request_log_cleanup'
    ),
    'timestamp', EXTRACT(EPOCH FROM now())::int
  );
$$;