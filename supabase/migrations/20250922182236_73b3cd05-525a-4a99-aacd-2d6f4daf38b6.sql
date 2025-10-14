-- Update build_public_payload_v2 function to include brands field
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
$function$