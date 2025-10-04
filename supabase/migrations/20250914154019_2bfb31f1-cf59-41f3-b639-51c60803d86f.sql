-- Backfill missing levels to 3★ for existing preferences
-- Update global_preferences likes and giftIdeas to include level=3 where missing
UPDATE profiles 
SET global_preferences = jsonb_set(
  jsonb_set(
    COALESCE(global_preferences, '{}'),
    '{likes}',
    (
      SELECT jsonb_agg(
        CASE 
          WHEN jsonb_typeof(item) = 'string' THEN 
            jsonb_build_object('label', item, 'level', 3)
          WHEN item ? 'level' THEN 
            item
          ELSE 
            item || jsonb_build_object('level', 3)
        END
      )
      FROM jsonb_array_elements(COALESCE(global_preferences->'likes', '[]')) AS item
    )
  ),
  '{giftIdeas}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN jsonb_typeof(item) = 'string' THEN 
          jsonb_build_object('label', item, 'level', 3)
        WHEN item ? 'level' THEN 
          item
        ELSE 
          item || jsonb_build_object('level', 3)
      END
    )
    FROM jsonb_array_elements(COALESCE(global_preferences->'giftIdeas', '[]')) AS item
  )
)
WHERE global_preferences IS NOT NULL 
  AND (
    jsonb_array_length(COALESCE(global_preferences->'likes', '[]')) > 0 
    OR jsonb_array_length(COALESCE(global_preferences->'giftIdeas', '[]')) > 0
  );

-- Update occasion_prefs to include level=3 where missing
UPDATE profiles 
SET occasion_prefs = (
  SELECT jsonb_object_agg(
    occasion_key,
    CASE 
      WHEN occasion_value ? 'likes' OR occasion_value ? 'giftIdeas' THEN
        jsonb_set(
          jsonb_set(
            occasion_value,
            '{likes}',
            (
              SELECT jsonb_agg(
                CASE 
                  WHEN jsonb_typeof(item) = 'string' THEN 
                    jsonb_build_object('label', item, 'level', 3)
                  WHEN item ? 'level' THEN 
                    item
                  ELSE 
                    item || jsonb_build_object('level', 3)
                END
              )
              FROM jsonb_array_elements(COALESCE(occasion_value->'likes', '[]')) AS item
            )
          ),
          '{giftIdeas}',
          (
            SELECT jsonb_agg(
              CASE 
                WHEN jsonb_typeof(item) = 'string' THEN 
                  jsonb_build_object('label', item, 'level', 3)
                WHEN item ? 'level' THEN 
                  item
                ELSE 
                  item || jsonb_build_object('level', 3)
              END
            )
            FROM jsonb_array_elements(COALESCE(occasion_value->'giftIdeas', '[]')) AS item
          )
        )
      ELSE occasion_value
    END
  )
  FROM jsonb_each(COALESCE(occasion_prefs, '{}')) AS occ(occasion_key, occasion_value)
)
WHERE occasion_prefs IS NOT NULL 
  AND jsonb_typeof(occasion_prefs) = 'object';

-- Update the get_public_profile_secure function to include level data
CREATE OR REPLACE FUNCTION public.get_public_profile_secure(profile_user_id uuid)
 RETURNS TABLE(
   user_id uuid, 
   display_name text, 
   avatar_url text, 
   bio text, 
   birthday date, 
   city text, 
   country text, 
   wishlist jsonb, 
   food_prefs jsonb, 
   style_prefs jsonb, 
   dislikes jsonb, 
   regift_enabled boolean, 
   regift_note text, 
   global_preferences jsonb,
   occasion_prefs jsonb, 
   updated_at timestamp with time zone
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.user_id,
    COALESCE((p.first_name || ' ' || COALESCE(p.last_name, '')), 'Utilisateur') AS display_name,
    p.avatar_url,
    p.bio,
    p.birthday,
    p.city,
    p.country,
    COALESCE(pr.current_wants, '[]'::jsonb) AS wishlist,
    COALESCE(pr.likes, '[]'::jsonb) AS food_prefs,
    COALESCE(pr.likes, '[]'::jsonb) AS style_prefs,
    COALESCE(pr.dislikes, '[]'::jsonb) AS dislikes,
    COALESCE(p.regift_enabled, false) AS regift_enabled,
    p.regift_note,
    COALESCE(p.global_preferences, '{}'::jsonb) AS global_preferences,
    COALESCE(p.occasion_prefs, '{}'::jsonb) AS occasion_prefs,
    p.updated_at
  FROM profiles p
  LEFT JOIN preferences pr ON pr.user_id = p.user_id
  WHERE p.user_id = profile_user_id
    AND EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.user_id = profile_user_id 
      AND sl.is_active = true
    );
$function$;