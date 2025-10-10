-- HOTFIX v7 - Visibilité des profils de mes contacts (corrigé)

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
    WHERE c.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM requests r 
        WHERE r.to_user_id = auth.uid() 
        AND r.from_user_id = profiles.user_id 
        AND r.status = 'accepted'
      )
  )
);

-- Vue lecture seule « public_profiles »
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT
  p.user_id,
  p.first_name || ' ' || COALESCE(p.last_name, '') AS display_name,
  '/placeholder.svg' AS avatar_url,
  p.bio,
  pr.likes as wishlist,
  pr.allergies as food_prefs,
  pr.likes as style_prefs,
  pr.dislikes,
  p.regift_enabled,
  p.regift_note,
  p.updated_at
FROM profiles p
LEFT JOIN preferences pr ON pr.user_id = p.user_id;