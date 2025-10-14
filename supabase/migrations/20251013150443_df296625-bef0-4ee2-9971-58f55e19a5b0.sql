
-- 1) Suppression de l'ancienne fonction
DROP FUNCTION IF EXISTS public.get_public_profile_secure(uuid);

-- 2) Création de la nouvelle fonction avec accès par contact
CREATE OR REPLACE FUNCTION public.get_public_profile_secure(profile_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  birthday date,
  city text,
  country text,
  global_preferences jsonb,
  occasion_prefs jsonb,
  regift_enabled boolean,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    COALESCE(p.first_name || ' ' || COALESCE(p.last_name, ''), p.first_name, 'Utilisateur') as display_name,
    p.avatar_url,
    p.birthday,
    p.city,
    p.country,
    p.global_preferences,
    p.occasion_prefs,
    COALESCE(p.regift_enabled, false) as regift_enabled,
    p.updated_at
  FROM profiles p
  WHERE p.user_id = profile_user_id
    AND (
      -- Profile has active share link
      EXISTS (
        SELECT 1 FROM share_links sl
        WHERE sl.user_id = profile_user_id
        AND sl.is_active = true
      )
      OR
      -- Viewer is a contact (bidirectional check)
      EXISTS (
        SELECT 1 FROM contacts c
        WHERE (c.owner_id = auth.uid() AND c.contact_user_id = profile_user_id)
           OR (c.contact_user_id = auth.uid() AND c.owner_id = profile_user_id)
      )
      OR
      -- Viewer is looking at their own profile
      auth.uid() = profile_user_id
    );
$$;

COMMENT ON FUNCTION public.get_public_profile_secure IS 'Retourne le profil public si: 1) share_link actif, 2) relation de contact existante, ou 3) profil propre';
