-- Create a user-level sync to ensure contacts exist for accepted requests
CREATE OR REPLACE FUNCTION public.sync_my_contacts_from_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inserted int := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert missing contact rows for current user based on accepted requests
  INSERT INTO contacts (owner_id, contact_user_id, alias)
  SELECT v_uid,
         CASE WHEN r.from_user_id = v_uid THEN r.to_user_id ELSE r.from_user_id END,
         NULL
  FROM requests r
  WHERE r.status = 'accepted'
    AND (r.from_user_id = v_uid OR r.to_user_id = v_uid)
    AND NOT EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.owner_id = v_uid
        AND c.contact_user_id = CASE WHEN r.from_user_id = v_uid THEN r.to_user_id ELSE r.from_user_id END
    );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;