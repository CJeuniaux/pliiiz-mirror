-- Explicitly set security_invoker on views to fix Security Definer View issues
-- This ensures views respect the calling user's permissions rather than the view creator's

-- Check current view properties and recreate with explicit security settings
ALTER VIEW public.my_contacts_view SET (security_invoker = on);
ALTER VIEW public.v_public_profile_source SET (security_invoker = on);  
ALTER VIEW public.v_unsplash_rebuild_stats SET (security_invoker = on);

-- Alternative approach: Recreate views with WITH (security_invoker = true)
DROP VIEW IF EXISTS public.my_contacts_view;
CREATE VIEW public.my_contacts_view 
WITH (security_invoker = true) AS
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

DROP VIEW IF EXISTS public.v_public_profile_source CASCADE;
CREATE VIEW public.v_public_profile_source
WITH (security_invoker = true) AS
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

DROP VIEW IF EXISTS public.v_unsplash_rebuild_stats;
CREATE VIEW public.v_unsplash_rebuild_stats
WITH (security_invoker = true) AS
SELECT 
  count(*) FILTER (WHERE generator_version = 'v1') AS v1_count,
  count(*) FILTER (WHERE generator_version = 'v2') AS v2_count,
  count(*) FILTER (WHERE generator_version = 'v2' AND image_url IS NOT NULL) AS v2_success,
  count(*) FILTER (WHERE generator_version = 'v2' AND image_url IS NULL) AS v2_fallback,
  avg(relevance_score) FILTER (WHERE generator_version = 'v2' AND image_url IS NOT NULL) AS avg_v2_score,
  count(DISTINCT gift_idea_hash) AS unique_ideas
FROM gift_idea_unsplash;

-- Recreate the build_public_payload_v2 function again
CREATE OR REPLACE FUNCTION public.build_public_payload_v2(source_row v_public_profile_source)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
  occasion_keys text[] := ARRAY['brunch', 'cremaillere', 'anniversaire', 'diner_amis'];
  occ_key text;
  occ_data jsonb;
BEGIN
  payload := jsonb_build_object(
    'user_id', source_row.user_id,
    'name', COALESCE(source_row.profile->>'name', null),
    'regift', COALESCE((source_row.profile->>'regift')::boolean, false),
    'age', CASE 
      WHEN source_row.profile->>'age' IS NOT NULL 
      THEN (source_row.profile->>'age')::integer 
      ELSE null 
    END,
    'city', COALESCE(source_row.profile->>'city', null),
    'likes', COALESCE(source_row.preferences->'likes', '[]'::jsonb),
    'avoid', COALESCE(source_row.preferences->'avoid', '[]'::jsonb),
    'gift_ideas', COALESCE(source_row.preferences->'gift_ideas', '[]'::jsonb),
    'brands', COALESCE(source_row.preferences->'brands', '[]'::jsonb),
    'sizes', jsonb_build_object(
      'top', COALESCE(source_row.preferences->'sizes'->>'top', null),
      'bottom', COALESCE(source_row.preferences->'sizes'->>'bottom', null),
      'shoes', COALESCE(source_row.preferences->'sizes'->>'shoes', null),
      'ring', COALESCE(source_row.preferences->'sizes'->>'ring', null),
      'other', COALESCE(source_row.preferences->'sizes'->>'other', null)
    ),
    'version', source_row.version,
    'updated_at', source_row.updated_at
  );

  payload := payload || jsonb_build_object('occasions', jsonb_build_object());
  
  FOREACH occ_key IN ARRAY occasion_keys
  LOOP
    occ_data := COALESCE(source_row.occasions->occ_key, '{}'::jsonb);
    payload := jsonb_set(
      payload,
      ARRAY['occasions', occ_key],
      jsonb_build_object(
        'likes', COALESCE(occ_data->'likes', '[]'::jsonb),
        'allergies', COALESCE(occ_data->'allergies', '[]'::jsonb),
        'avoid', COALESCE(occ_data->'avoid', '[]'::jsonb),
        'gift_ideas', COALESCE(occ_data->'giftIdeas', occ_data->'gift_ideas', '[]'::jsonb)
      )
    );
  END LOOP;

  RETURN payload;
END;
$function$;