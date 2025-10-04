-- Update v_public_profile_source view to include brands field in preferences
CREATE OR REPLACE VIEW v_public_profile_source AS
SELECT 
  user_id,
  jsonb_build_object(
    'name', COALESCE(first_name || ' ' || COALESCE(last_name, ''), first_name, last_name),
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
    'cremaillere', COALESCE(occasion_prefs->'cremaillere', occasion_prefs->'crémaillère', '{}'::jsonb),
    'anniversaire', COALESCE(occasion_prefs->'anniversaire', occasion_prefs->'anniversaires', '{}'::jsonb),
    'diner_amis', COALESCE(occasion_prefs->'diner_amis', occasion_prefs->'diner-entre-amis', '{}'::jsonb)
  ) AS occasions,
  1 AS version,
  updated_at::text
FROM profiles p
WHERE EXISTS (
  SELECT 1 FROM share_links sl 
  WHERE sl.user_id = p.user_id 
  AND sl.is_active = true
);