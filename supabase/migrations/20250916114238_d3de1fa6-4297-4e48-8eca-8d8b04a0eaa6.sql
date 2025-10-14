-- Create helper functions for the replication worker

-- Function to upsert public profile versions with idempotency
CREATE OR REPLACE FUNCTION public.upsert_public_profile_version(
  p_user_id UUID,
  p_version BIGINT,
  p_checksum TEXT,
  p_public_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_profile_versions (
    user_id, 
    version, 
    checksum, 
    last_synced_at,
    source_updated_at
  )
  VALUES (
    p_user_id, 
    p_version, 
    p_checksum, 
    now(),
    COALESCE((p_public_payload->>'updated_at')::timestamptz, now())
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    version = EXCLUDED.version,
    checksum = EXCLUDED.checksum,
    last_synced_at = now(),
    source_updated_at = EXCLUDED.source_updated_at
  WHERE 
    public_profile_versions.version < EXCLUDED.version 
    OR public_profile_versions.checksum <> EXCLUDED.checksum;
END;
$$;

-- Function to find profiles that need reconciliation
CREATE OR REPLACE FUNCTION public.find_inconsistent_profiles()
RETURNS TABLE(
  user_id UUID,
  source_version BIGINT,
  source_checksum TEXT,
  public_version BIGINT,
  public_checksum TEXT,
  needs_update BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH source_profiles AS (
    SELECT 
      p.user_id,
      1 as source_version, -- For now, simplified versioning
      md5(
        jsonb_build_object(
          'user_id', p.user_id,
          'first_name', p.first_name,
          'last_name', p.last_name,
          'avatar_url', p.avatar_url,
          'bio', p.bio,
          'birthday', p.birthday,
          'city', p.city,
          'country', p.country,
          'global_preferences', p.global_preferences,
          'occasion_prefs', p.occasion_prefs,
          'regift_enabled', p.regift_enabled,
          'regift_note', p.regift_note,
          'updated_at', p.updated_at
        )::text
      ) as source_checksum,
      p.first_name,
      p.last_name,
      p.avatar_url,
      p.bio,
      p.birthday,
      p.city,
      p.country,
      p.global_preferences,
      p.occasion_prefs,
      p.regift_enabled,
      p.regift_note,
      p.updated_at
    FROM profiles p
    WHERE EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.user_id = p.user_id 
      AND sl.is_active = true
    )
  )
  SELECT 
    sp.user_id,
    sp.source_version,
    sp.source_checksum,
    COALESCE(ppv.version, 0) as public_version,
    COALESCE(ppv.checksum, '') as public_checksum,
    (ppv.user_id IS NULL OR ppv.checksum <> sp.source_checksum) as needs_update
  FROM source_profiles sp
  LEFT JOIN public_profile_versions ppv ON ppv.user_id = sp.user_id
  WHERE ppv.user_id IS NULL OR ppv.checksum <> sp.source_checksum;
$$;

-- Function to get replication metrics for monitoring
CREATE OR REPLACE FUNCTION public.get_replication_status()
RETURNS TABLE(
  metric_name TEXT,
  metric_value BIGINT,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT metric_name, metric_value, updated_at
  FROM replication_metrics
  ORDER BY metric_name;
$$;

-- Function to clean up old processed outbox items (for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_processed_outbox(older_than_hours INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM replication_outbox 
  WHERE processed_at IS NOT NULL 
    AND processed_at < (now() - (older_than_hours || ' hours')::interval);
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;