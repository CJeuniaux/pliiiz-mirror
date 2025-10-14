-- HOTFIX v10: Create proper contacts table and trigger
-- 1) Create contacts table with proper structure
DROP TABLE IF EXISTS contacts CASCADE;
CREATE TABLE contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  contact_user_id UUID NOT NULL,
  alias TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own contacts" ON contacts
FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own contacts" ON contacts
FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own contacts" ON contacts
FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
FOR DELETE USING (auth.uid() = owner_id);

-- 2) Create unique index to avoid duplicates
CREATE UNIQUE INDEX IF NOT EXISTS contacts_owner_contact_unique
  ON contacts(owner_id, contact_user_id);

-- 3) Create trigger function for request acceptance
CREATE OR REPLACE FUNCTION make_contacts_on_accept()
RETURNS trigger LANGUAGE plpgsql AS $$
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

-- 4) Create the trigger
DROP TRIGGER IF EXISTS trg_requests_accept ON requests;
CREATE TRIGGER trg_requests_accept
AFTER UPDATE ON requests
FOR EACH ROW EXECUTE FUNCTION make_contacts_on_accept();

-- 5) Create view for easy contacts querying
DROP VIEW IF EXISTS my_contacts_view;
CREATE VIEW my_contacts_view AS
SELECT 
  c.owner_id,
  c.contact_user_id as user_id,
  p.first_name || ' ' || COALESCE(p.last_name, '') as display_name,
  p.avatar_url,
  c.alias,
  c.created_at
FROM contacts c
JOIN profiles p ON p.user_id = c.contact_user_id;