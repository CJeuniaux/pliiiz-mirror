-- Suppression de la vue et création d'une fonction sécurisée
DROP VIEW IF EXISTS public_profiles;

-- Fonction sécurisée pour obtenir les profils publics
CREATE OR REPLACE FUNCTION get_public_profiles()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  wishlist text[],
  food_prefs text[],
  style_prefs text[],
  dislikes text[],
  regift_enabled boolean,
  regift_note text,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  LEFT JOIN preferences pr ON pr.user_id = p.user_id
  WHERE p.user_id = auth.uid()
     OR EXISTS (
       SELECT 1 FROM requests r 
       WHERE ((r.to_user_id = auth.uid() AND r.from_user_id = p.user_id)
              OR (r.from_user_id = auth.uid() AND r.to_user_id = p.user_id))
       AND r.status = 'accepted'
     );
$$;