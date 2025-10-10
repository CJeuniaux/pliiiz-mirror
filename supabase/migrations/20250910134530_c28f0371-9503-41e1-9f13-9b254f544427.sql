-- Fix security issues for HOTFIX v10
-- 1) Fix the trigger function search path
CREATE OR REPLACE FUNCTION make_contacts_on_accept()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP='UPDATE' AND NEW.status='accepted' AND COALESCE(OLD.status,'')<>'accepted' THEN
    -- Create contact for the requester
    INSERT INTO contacts(owner_id, contact_user_id, alias, created_at)
    VALUES (NEW.from_user_id, NEW.to_user_id, NULL, now())
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;

    -- Create contact for the accepter
    INSERT INTO contacts(owner_id, contact_user_id, alias, created_at)
    VALUES (NEW.to_user_id, NEW.from_user_id, NULL, now())
    ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

-- 2) Make the view safer by using a security definer function instead
DROP VIEW IF EXISTS my_contacts_view;

CREATE OR REPLACE FUNCTION get_user_contacts(user_uuid uuid)
RETURNS TABLE(
  owner_id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  alias text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.owner_id,
    c.contact_user_id as user_id,
    p.first_name || ' ' || COALESCE(p.last_name, '') as display_name,
    p.avatar_url,
    c.alias,
    c.created_at
  FROM contacts c
  JOIN profiles p ON p.user_id = c.contact_user_id
  WHERE c.owner_id = user_uuid;
$$;