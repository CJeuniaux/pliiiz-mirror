-- 1) Bucket public "avatars"
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars','avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2) Politiques RLS sur storage.objects
-- Lire: tout le monde peut LIRE dans le bucket "avatars" (public)
CREATE POLICY IF NOT EXISTS "avatars read public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Écrire/MAJ/Supprimer: uniquement le propriétaire connecté
CREATE POLICY IF NOT EXISTS "avatars insert owner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "avatars update owner"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "avatars delete owner"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3) Ajouter avatar_url à la table profiles si pas présent
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 4) RLS étendu pour PROFILES : SELECT si c'est moi OU mon contact
DROP POLICY IF EXISTS "prof_sel_self_or_ctc" ON profiles;
CREATE POLICY "prof_sel_self_or_ctc" ON profiles
FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM contacts c WHERE c.user_id = auth.uid() AND c.first_name IS NOT NULL)
);

-- 5) RLS étendu pour PREFERENCES : SELECT si c'est moi OU mon contact
DROP POLICY IF EXISTS "pref_sel_self_or_ctc" ON preferences;
CREATE POLICY "pref_sel_self_or_ctc" ON preferences
FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM contacts c WHERE c.user_id = auth.uid() AND c.first_name IS NOT NULL)
);

-- 6) VUE "public_profiles" (lecture consolidée d'un contact)
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT
  p.user_id,
  CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) as display_name,
  p.avatar_url,
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