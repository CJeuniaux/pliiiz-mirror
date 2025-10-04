-- Fix RLS security issues and add triggers for outbox pattern

-- Enable RLS on new tables
ALTER TABLE public.replication_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profile_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replication_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for replication_outbox (system-only access)
CREATE POLICY "System can manage replication outbox" ON public.replication_outbox
FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for public_profile_versions (read-only for authenticated users)
CREATE POLICY "Users can view profile versions" ON public.public_profile_versions
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage profile versions" ON public.public_profile_versions
FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for replication_metrics (read-only for authenticated users)
CREATE POLICY "Users can view replication metrics" ON public.replication_metrics
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage replication metrics" ON public.replication_metrics
FOR ALL USING (auth.role() = 'service_role');

-- Fix search_path for existing functions
CREATE OR REPLACE FUNCTION public.calculate_profile_checksum(profile_data JSONB)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN md5(profile_data::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_profile_idempotency_key(p_user_id UUID, p_version BIGINT)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'profile_' || p_user_id::text || '_v' || p_version::text;
END;
$$;

-- Trigger function to add events to outbox when profiles are modified
CREATE OR REPLACE FUNCTION public.trigger_profile_replication_outbox()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_payload JSONB;
  version_num BIGINT;
  idempotency_key TEXT;
BEGIN
  -- Determine version number
  IF TG_OP = 'INSERT' THEN
    version_num := 1;
    event_payload := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    version_num := COALESCE(OLD.global_preferences->>'_version', '1')::BIGINT + 1;
    event_payload := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    version_num := COALESCE(OLD.global_preferences->>'_version', '1')::BIGINT + 1;
    event_payload := to_jsonb(OLD);
  END IF;

  -- Generate idempotency key
  idempotency_key := generate_profile_idempotency_key(
    COALESCE(NEW.user_id, OLD.user_id), 
    version_num
  );

  -- Insert into outbox
  INSERT INTO public.replication_outbox (
    user_id,
    event_type,
    source_version,
    payload,
    idempotency_key
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    CASE WHEN TG_OP = 'DELETE' THEN 'DELETE_PROFILE' ELSE 'UPSERT_PROFILE' END,
    version_num,
    event_payload,
    idempotency_key
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers to profiles table
DROP TRIGGER IF EXISTS profiles_replication_trigger ON public.profiles;
CREATE TRIGGER profiles_replication_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_profile_replication_outbox();

-- Add triggers to preferences table  
DROP TRIGGER IF EXISTS preferences_replication_trigger ON public.preferences;
CREATE TRIGGER preferences_replication_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_profile_replication_outbox();