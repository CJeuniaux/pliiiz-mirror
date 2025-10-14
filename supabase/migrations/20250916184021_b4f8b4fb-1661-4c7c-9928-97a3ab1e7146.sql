-- Preferences stabilisation + RPC api.save_preferences_v2
-- 1) Ensure schema and structure are safe/idempotent
CREATE SCHEMA IF NOT EXISTS api;

-- Ensure unique constraint on preferences.user_id to allow ON CONFLICT (user_id)
CREATE UNIQUE INDEX IF NOT EXISTS ux_preferences_user_id ON public.preferences(user_id);

-- Normalize defaults to avoid NULLs
ALTER TABLE public.preferences ALTER COLUMN likes SET DEFAULT '{}'::text[];
ALTER TABLE public.preferences ALTER COLUMN dislikes SET DEFAULT '{}'::text[];
ALTER TABLE public.preferences ALTER COLUMN allergies SET DEFAULT '{}'::text[];
ALTER TABLE public.preferences ALTER COLUMN current_wants SET DEFAULT '{}'::text[];
ALTER TABLE public.preferences ALTER COLUMN gift_ideas SET DEFAULT '{}'::text[];
ALTER TABLE public.preferences ALTER COLUMN sizes SET DEFAULT '{}'::jsonb;
ALTER TABLE public.preferences ALTER COLUMN updated_at SET DEFAULT now();

-- Coalesce existing NULL values
UPDATE public.preferences
SET 
  likes = COALESCE(likes, '{}'::text[]),
  dislikes = COALESCE(dislikes, '{}'::text[]),
  allergies = COALESCE(allergies, '{}'::text[]),
  current_wants = COALESCE(current_wants, '{}'::text[]),
  gift_ideas = COALESCE(gift_ideas, '{}'::text[]),
  sizes = COALESCE(sizes, '{}'::jsonb),
  updated_at = COALESCE(updated_at, now())
WHERE
  likes IS NULL 
  OR dislikes IS NULL
  OR allergies IS NULL
  OR current_wants IS NULL
  OR gift_ideas IS NULL
  OR sizes IS NULL
  OR updated_at IS NULL;

-- Useful index
CREATE INDEX IF NOT EXISTS idx_preferences_updated_at ON public.preferences(updated_at DESC);

-- Ensure RLS and minimal self policies exist (idempotent creation)
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'preferences' AND polname = 'prefs_select_self') THEN
    CREATE POLICY "prefs_select_self"
      ON public.preferences
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'preferences' AND polname = 'prefs_insert_self') THEN
    CREATE POLICY "prefs_insert_self"
      ON public.preferences
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'preferences' AND polname = 'prefs_update_self') THEN
    CREATE POLICY "prefs_update_self"
      ON public.preferences
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 2) RPC: api.save_preferences_v2
CREATE OR REPLACE FUNCTION api.save_preferences_v2(
  p_user_id uuid,
  p_likes jsonb DEFAULT '[]'::jsonb,
  p_avoid jsonb DEFAULT '[]'::jsonb,
  p_gift_ideas jsonb DEFAULT '[]'::jsonb,
  p_sizes jsonb DEFAULT '{}'::jsonb,
  p_occasions jsonb DEFAULT '{}'::jsonb,
  p_allergies jsonb DEFAULT '[]'::jsonb,
  p_current_wants jsonb DEFAULT '[]'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version bigint;
  v_payload jsonb;
BEGIN
  -- Security: caller must be the owner
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- Normalize
  p_likes := COALESCE(p_likes, '[]'::jsonb);
  p_avoid := COALESCE(p_avoid, '[]'::jsonb);
  p_gift_ideas := COALESCE(p_gift_ideas, '[]'::jsonb);
  p_sizes := COALESCE(p_sizes, '{}'::jsonb);
  p_occasions := COALESCE(p_occasions, '{}'::jsonb);
  p_allergies := COALESCE(p_allergies, '[]'::jsonb);
  p_current_wants := COALESCE(p_current_wants, '[]'::jsonb);

  -- Upsert preferences using existing helper (handles arrays conversion)
  PERFORM public.safe_upsert_preferences(
    p_user_id,
    jsonb_build_object(
      'likes', p_likes,
      'dislikes', p_avoid,
      'gift_ideas', p_gift_ideas,
      'sizes', p_sizes,
      'allergies', p_allergies,
      'current_wants', p_current_wants
    )
  );

  -- Optionally merge occasions into profiles.occasion_prefs
  IF p_occasions <> '{}'::jsonb THEN
    UPDATE public.profiles
    SET occasion_prefs = COALESCE(occasion_prefs, '{}'::jsonb) || p_occasions,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  -- Bump global_preferences version without overwriting data
  UPDATE public.profiles
  SET 
    global_preferences = 
      CASE 
        WHEN global_preferences IS NULL THEN jsonb_build_object('_version', 1)
        WHEN (global_preferences ? '_version') THEN jsonb_set(global_preferences, '{_version}', to_jsonb(((global_preferences->>'_version')::int + 1)))
        ELSE jsonb_set(COALESCE(global_preferences, '{}'::jsonb), '{_version}', '1'::jsonb)
      END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING (global_preferences->>'_version')::bigint INTO v_version;

  -- Build payload
  SELECT to_jsonb(p.*) INTO v_payload
  FROM public.profiles p
  WHERE p.user_id = p_user_id;

  -- Insert outbox event (idempotent)
  INSERT INTO public.replication_outbox (user_id, event_type, source_version, payload, idempotency_key)
  VALUES (
    p_user_id,
    'UPSERT_PROFILE',
    COALESCE(v_version, 1),
    v_payload,
    public.generate_profile_idempotency_key(p_user_id, COALESCE(v_version, 1))
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

END;
$$;

REVOKE ALL ON FUNCTION api.save_preferences_v2(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.save_preferences_v2(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) TO authenticated, service_role;