-- HOTFIX v7 - Visibilité des profils de mes contacts + halo header

-- PROFILES : lecture = moi OU mes contacts
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prof_sel_self        ON profiles;
DROP POLICY IF EXISTS prof_sel_self_or_ctc ON profiles;

-- (on garde les INSERT/UPDATE "self" déjà mis en place)
CREATE POLICY prof_sel_self_or_ctc ON profiles
FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.owner_id = auth.uid()
      AND c.contact_user_id = profiles.user_id
  )
);

-- Vue lecture seule « public_profiles »
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT
  u.id          AS user_id,
  u.display_name,
  u.avatar_url,
  p.bio,
  p.wishlist,
  p.food_prefs,
  p.style_prefs,
  p.dislikes,
  p.regift_enabled,
  p.regift_note,
  p.updated_at
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id;