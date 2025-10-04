-- Function to get contacts with their new global preferences structure
CREATE OR REPLACE FUNCTION public.get_contacts_with_global_preferences()
RETURNS TABLE(
  contact_id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  city text,
  regift_enabled boolean,
  birthday date,
  global_preferences jsonb,
  occasion_prefs jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    c.id as contact_id,
    c.contact_user_id as user_id,
    COALESCE((p.first_name || ' ' || COALESCE(p.last_name, '')), 'Contact') as display_name,
    p.avatar_url,
    p.city,
    COALESCE(p.regift_enabled, false) as regift_enabled,
    p.birthday,
    COALESCE(p.global_preferences, '{"avoid": [], "likes": [], "sizes": {}, "allergies": [], "giftIdeas": []}'::jsonb) as global_preferences,
    COALESCE(p.occasion_prefs, '{}'::jsonb) as occasion_prefs
  FROM contacts c
  LEFT JOIN profiles p ON p.user_id = c.contact_user_id
  WHERE c.owner_id = auth.uid()
  ORDER BY LOWER(COALESCE((p.first_name || ' ' || COALESCE(p.last_name, '')), 'Contact')) ASC;
$$;