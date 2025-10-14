-- Correction des problèmes de sécurité - Suppression des vues security definer

-- Recréer la vue public_profiles sans security definer (elle hérite automatiquement des RLS)
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

-- Supprimer les anciennes vues qui causent des problèmes
DROP VIEW IF EXISTS safe_public_profiles;