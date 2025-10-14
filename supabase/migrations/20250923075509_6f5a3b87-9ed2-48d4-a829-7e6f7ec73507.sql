-- Fix Security Definer Views issue by recreating views with proper RLS handling
-- Drop and recreate views to ensure they don't have SECURITY DEFINER behavior

-- Drop existing views
DROP VIEW IF EXISTS public.my_contacts_view;
DROP VIEW IF EXISTS public.v_public_profile_source;
DROP VIEW IF EXISTS public.v_unsplash_rebuild_stats;

-- Recreate my_contacts_view with explicit RLS respect
CREATE VIEW public.my_contacts_view AS
SELECT 
  c.owner_id,
  c.contact_user_id AS user_id,
  COALESCE((p.first_name || ' ' || COALESCE(p.last_name, '')), 'Contact') AS display_name,
  p.avatar_url,
  p.birthday,
  COALESCE(pr.current_wants, '{}') AS wishlist,
  COALESCE(p.regift_enabled, false) AS regift_enabled,
  (SELECT array_agg(elem) FROM (
    SELECT unnest(COALESCE(pr.current_wants, '{}')) AS elem LIMIT 3
  ) x) AS wishlist_top3
FROM contacts c
LEFT JOIN profiles p ON p.user_id = c.contact_user_id
LEFT JOIN preferences pr ON pr.user_id = c.contact_user_id;

-- Enable RLS on the view (this ensures it respects underlying table RLS)
ALTER VIEW public.my_contacts_view SET (security_invoker = true);

-- Recreate v_public_profile_source with explicit RLS respect  
CREATE VIEW public.v_public_profile_source AS
SELECT 
  user_id,
  jsonb_build_object(
    'name', COALESCE((first_name || ' ' || COALESCE(last_name, '')), first_name, last_name),
    'regift', COALESCE(regift_enabled, false),
    'age', CASE 
      WHEN birthday IS NOT NULL 
      THEN EXTRACT(year FROM age(birthday::timestamp with time zone))::integer 
      ELSE NULL 
    END,
    'city', city
  ) AS profile,
  jsonb_build_object(
    'likes', COALESCE(global_preferences->'likes', '[]'::jsonb),
    'avoid', COALESCE(global_preferences->'avoid', '[]'::jsonb), 
    'gift_ideas', COALESCE(global_preferences->'giftIdeas', '[]'::jsonb),
    'sizes', COALESCE(global_preferences->'sizes', '{}'::jsonb),
    'brands', COALESCE(global_preferences->'brands', '[]'::jsonb)
  ) AS preferences,
  jsonb_build_object(
    'brunch', COALESCE(occasion_prefs->'brunch', '{}'::jsonb),
    'cremaillere', COALESCE(
      occasion_prefs->'cremaillere', 
      occasion_prefs->'crémaillère', 
      '{}'::jsonb
    ),
    'anniversaire', COALESCE(
      occasion_prefs->'anniversaire', 
      occasion_prefs->'anniversaires', 
      '{}'::jsonb
    ),
    'diner_amis', COALESCE(
      occasion_prefs->'diner_amis', 
      occasion_prefs->'diner-entre-amis', 
      '{}'::jsonb
    )
  ) AS occasions,
  1 AS version,
  updated_at::text AS updated_at
FROM profiles p
WHERE EXISTS (
  SELECT 1 FROM share_links sl 
  WHERE sl.user_id = p.user_id AND sl.is_active = true
);

-- Enable RLS on the view
ALTER VIEW public.v_public_profile_source SET (security_invoker = true);

-- Recreate v_unsplash_rebuild_stats with explicit RLS respect
CREATE VIEW public.v_unsplash_rebuild_stats AS
SELECT 
  count(*) FILTER (WHERE generator_version = 'v1') AS v1_count,
  count(*) FILTER (WHERE generator_version = 'v2') AS v2_count,
  count(*) FILTER (WHERE generator_version = 'v2' AND image_url IS NOT NULL) AS v2_success,
  count(*) FILTER (WHERE generator_version = 'v2' AND image_url IS NULL) AS v2_fallback,
  avg(relevance_score) FILTER (WHERE generator_version = 'v2' AND image_url IS NOT NULL) AS avg_v2_score,
  count(DISTINCT gift_idea_hash) AS unique_ideas
FROM gift_idea_unsplash;

-- Enable RLS on the view
ALTER VIEW public.v_unsplash_rebuild_stats SET (security_invoker = true);