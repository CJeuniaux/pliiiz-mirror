-- Améliorer get_public_profile_secure pour inclure avatar_url avec JOIN explicite
CREATE OR REPLACE FUNCTION public.get_public_profile_secure(profile_user_id uuid)
RETURNS TABLE(
  user_id uuid, 
  display_name text, 
  avatar_url text, 
  bio text, 
  birthday date, 
  city text, 
  country text, 
  global_preferences jsonb, 
  occasion_prefs jsonb, 
  wishlist jsonb, 
  food_prefs jsonb, 
  style_prefs jsonb, 
  dislikes jsonb, 
  allergies jsonb, 
  regift_enabled boolean, 
  regift_note text, 
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    COALESCE((p.first_name || ' ' || COALESCE(p.last_name, '')), 'Utilisateur') AS display_name,
    p.avatar_url,
    p.bio,
    p.birthday,
    p.city,
    p.country,
    -- New system (profiles)
    COALESCE(p.global_preferences, '{"avoid": [], "likes": [], "sizes": {}, "allergies": [], "giftIdeas": []}'::jsonb) AS global_preferences,
    COALESCE(p.occasion_prefs, '{}'::jsonb) AS occasion_prefs,
    -- Legacy compatibility (preferences table)
    COALESCE(to_jsonb(pr.current_wants), '[]'::jsonb) AS wishlist,
    COALESCE(to_jsonb(pr.likes), '[]'::jsonb) AS food_prefs,
    COALESCE(to_jsonb(pr.likes), '[]'::jsonb) AS style_prefs,
    COALESCE(to_jsonb(pr.dislikes), '[]'::jsonb) AS dislikes,
    COALESCE(to_jsonb(pr.allergies), '[]'::jsonb) AS allergies,
    COALESCE(p.regift_enabled, false) AS regift_enabled,
    p.regift_note,
    p.updated_at
  FROM profiles p
  LEFT JOIN preferences pr ON pr.user_id = p.user_id
  WHERE p.user_id = profile_user_id
    AND EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.user_id = profile_user_id 
      AND sl.is_active = true
    );
$$;