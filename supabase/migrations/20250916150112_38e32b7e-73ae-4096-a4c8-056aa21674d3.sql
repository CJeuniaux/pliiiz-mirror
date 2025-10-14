-- Fix ambiguous reference in trigger_profile_replication_outbox
CREATE OR REPLACE FUNCTION public.trigger_profile_replication_outbox()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  event_payload JSONB;
  version_num BIGINT;
  v_idempotency_key TEXT;
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
  v_idempotency_key := generate_profile_idempotency_key(
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
    v_idempotency_key
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN COALESCE(NEW, OLD);
END;
$function$;