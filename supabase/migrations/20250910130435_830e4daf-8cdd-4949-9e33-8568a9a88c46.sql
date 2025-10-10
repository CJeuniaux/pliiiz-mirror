-- Add city and country columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;

-- Add display_name to users table if not exists (for avatar_url we might need this)
-- Note: we'll store avatar_url in profiles table since we have access to it there
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;