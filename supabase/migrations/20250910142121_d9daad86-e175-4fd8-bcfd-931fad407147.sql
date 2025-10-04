-- Add missing fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occasion_prefs jsonb DEFAULT '{}'::jsonb;

-- Create view for contact cards with wishlist teasers
DROP VIEW IF EXISTS my_contacts_view;
CREATE VIEW my_contacts_view AS
SELECT
  c.owner_id,
  c.contact_user_id AS user_id,
  COALESCE(p.first_name || ' ' || COALESCE(p.last_name, ''), 'Contact') AS display_name,
  p.avatar_url,
  p.birthday,
  COALESCE(pr.current_wants, '{}') AS wishlist,
  COALESCE(p.regift_enabled, false) AS regift_enabled,
  (
    SELECT array_agg(x.elem) FROM (
      SELECT unnest(COALESCE(pr.current_wants, '{}')) AS elem LIMIT 3
    ) x
  ) AS wishlist_top3
FROM contacts c
LEFT JOIN profiles p ON p.user_id = c.contact_user_id
LEFT JOIN preferences pr ON pr.user_id = c.contact_user_id;

-- Create view for public profiles (accessible to contacts)
DROP VIEW IF EXISTS public_profiles_view;
CREATE VIEW public_profiles_view AS
SELECT
  p.user_id,
  COALESCE(p.first_name || ' ' || COALESCE(p.last_name, ''), 'Utilisateur') AS display_name,
  p.avatar_url,
  p.bio,
  p.birthday,
  p.city,
  p.country,
  COALESCE(pr.current_wants, '{}') AS wishlist,
  COALESCE(pr.likes, '{}') AS food_prefs,
  COALESCE(pr.likes, '{}') AS style_prefs,
  COALESCE(pr.dislikes, '{}') AS dislikes,
  COALESCE(p.regift_enabled, false) AS regift_enabled,
  p.regift_note,
  COALESCE(p.occasion_prefs, '{}'::jsonb) AS occasion_prefs,
  p.updated_at
FROM profiles p
LEFT JOIN preferences pr ON pr.user_id = p.user_id;