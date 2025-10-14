-- Vue source consolidée pour Public Profile v2
CREATE OR REPLACE VIEW v_public_profile_source AS
SELECT
  p.user_id,
  jsonb_build_object(
    'name', COALESCE(p.first_name || ' ' || COALESCE(p.last_name, ''), p.first_name, p.last_name),
    'regift', COALESCE(p.regift_enabled, false),
    'age', CASE 
      WHEN p.birthday IS NOT NULL 
      THEN EXTRACT(YEAR FROM AGE(p.birthday))::integer 
      ELSE NULL 
    END,
    'city', p.city
  ) AS profile,
  jsonb_build_object(
    'likes', COALESCE((p.global_preferences->'likes'), '[]'::jsonb),
    'avoid', COALESCE((p.global_preferences->'avoid'), '[]'::jsonb),
    'gift_ideas', COALESCE((p.global_preferences->'giftIdeas'), '[]'::jsonb),
    'sizes', COALESCE((p.global_preferences->'sizes'), '{}'::jsonb)
  ) AS preferences,
  -- Normalisation des clés d'occasions
  jsonb_build_object(
    'brunch', COALESCE(
      (p.occasion_prefs->'brunch'),
      (p.occasion_prefs->'brunch-dimanche'),
      '{}'::jsonb
    ),
    'cremaillere', COALESCE(
      (p.occasion_prefs->'cremaillere'),
      (p.occasion_prefs->'crémaillère'),
      (p.occasion_prefs->'housewarming'),
      '{}'::jsonb
    ),
    'anniversaire', COALESCE(
      (p.occasion_prefs->'anniversaire'),
      (p.occasion_prefs->'anniversaires'),
      (p.occasion_prefs->'birthday'),
      '{}'::jsonb
    ),
    'diner_amis', COALESCE(
      (p.occasion_prefs->'diner_amis'),
      (p.occasion_prefs->'diner-entre-amis'),
      (p.occasion_prefs->'dinner'),
      '{}'::jsonb
    )
  ) AS occasions,
  1 AS version, -- Version simplifiée pour l'instant
  p.updated_at::text AS updated_at
FROM profiles p
WHERE EXISTS (
  SELECT 1 FROM share_links sl 
  WHERE sl.user_id = p.user_id 
  AND sl.is_active = true
);

-- Fonction pour construire le payload public v2 en SQL
CREATE OR REPLACE FUNCTION build_public_payload_v2(source_row v_public_profile_source)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  payload jsonb;
  occasion_keys text[] := ARRAY['brunch', 'cremaillere', 'anniversaire', 'diner_amis'];
  occ_key text;
  occ_data jsonb;
BEGIN
  -- Construction du payload de base
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

  -- Construction des occasions normalisées
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
$$;

-- Fonction de réconciliation sélective v2
CREATE OR REPLACE FUNCTION find_inconsistent_profiles_v2()
RETURNS TABLE(
  user_id uuid,
  miss_name boolean,
  miss_regift boolean,
  miss_age boolean,
  miss_city boolean,
  miss_likes boolean,
  miss_avoid boolean,
  miss_gift_ideas boolean,
  miss_sizes boolean,
  miss_occ_brunch boolean,
  miss_occ_cremaillere boolean,
  miss_occ_anniversaire boolean,
  miss_occ_diner_amis boolean,
  miss_allergies_brunch boolean,
  miss_allergies_cremaillere boolean,
  miss_allergies_anniversaire boolean,
  miss_allergies_diner_amis boolean,
  diff_payload boolean,
  missing_fields text[],
  source_checksum text,
  public_checksum text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH src AS (
    SELECT 
      v.user_id,
      build_public_payload_v2(v) AS payload
    FROM v_public_profile_source v
  ),
  checksums AS (
    SELECT 
      s.user_id,
      s.payload,
      encode(digest(s.payload::text, 'sha256'), 'hex') AS source_checksum
    FROM src s
  ),
  pub AS (
    SELECT 
      user_id, 
      checksum as public_checksum
    FROM public_profile_versions
  ),
  analysis AS (
    SELECT 
      s.user_id,
      s.payload,
      s.source_checksum,
      COALESCE(p.public_checksum, '') as public_checksum,
      -- Vérifications de champs manquants
      (s.payload->>'name') IS NULL AS miss_name,
      (s.payload->>'regift') IS NULL AS miss_regift,
      (s.payload->>'age') IS NULL AS miss_age,
      (s.payload->>'city') IS NULL AS miss_city,
      (s.payload->'likes') IS NULL AS miss_likes,
      (s.payload->'avoid') IS NULL AS miss_avoid,
      (s.payload->'gift_ideas') IS NULL AS miss_gift_ideas,
      (s.payload->'sizes') IS NULL AS miss_sizes,
      (s.payload#>'{occasions,brunch}') IS NULL AS miss_occ_brunch,
      (s.payload#>'{occasions,cremaillere}') IS NULL AS miss_occ_cremaillere,
      (s.payload#>'{occasions,anniversaire}') IS NULL AS miss_occ_anniversaire,
      (s.payload#>'{occasions,diner_amis}') IS NULL AS miss_occ_diner_amis,
      (s.payload#>'{occasions,brunch,allergies}') IS NULL AS miss_allergies_brunch,
      (s.payload#>'{occasions,cremaillere,allergies}') IS NULL AS miss_allergies_cremaillere,
      (s.payload#>'{occasions,anniversaire,allergies}') IS NULL AS miss_allergies_anniversaire,
      (s.payload#>'{occasions,diner_amis,allergies}') IS NULL AS miss_allergies_diner_amis,
      -- Différence de checksum
      (p.public_checksum IS NULL OR p.public_checksum <> s.source_checksum) AS diff_payload
    FROM checksums s
    LEFT JOIN pub p ON p.user_id = s.user_id
  )
  SELECT 
    a.user_id,
    a.miss_name,
    a.miss_regift,
    a.miss_age,
    a.miss_city,
    a.miss_likes,
    a.miss_avoid,
    a.miss_gift_ideas,
    a.miss_sizes,
    a.miss_occ_brunch,
    a.miss_occ_cremaillere,
    a.miss_occ_anniversaire,
    a.miss_occ_diner_amis,
    a.miss_allergies_brunch,
    a.miss_allergies_cremaillere,
    a.miss_allergies_anniversaire,
    a.miss_allergies_diner_amis,
    a.diff_payload,
    -- Construction de la liste des champs manquants
    ARRAY_REMOVE(ARRAY[
      CASE WHEN a.miss_name THEN 'name' END,
      CASE WHEN a.miss_regift THEN 'regift' END,
      CASE WHEN a.miss_age THEN 'age' END,
      CASE WHEN a.miss_city THEN 'city' END,
      CASE WHEN a.miss_likes THEN 'likes' END,
      CASE WHEN a.miss_avoid THEN 'avoid' END,
      CASE WHEN a.miss_gift_ideas THEN 'gift_ideas' END,
      CASE WHEN a.miss_sizes THEN 'sizes' END,
      CASE WHEN a.miss_occ_brunch THEN 'occasions.brunch' END,
      CASE WHEN a.miss_occ_cremaillere THEN 'occasions.cremaillere' END,
      CASE WHEN a.miss_occ_anniversaire THEN 'occasions.anniversaire' END,
      CASE WHEN a.miss_occ_diner_amis THEN 'occasions.diner_amis' END,
      CASE WHEN a.miss_allergies_brunch THEN 'occasions.brunch.allergies' END,
      CASE WHEN a.miss_allergies_cremaillere THEN 'occasions.cremaillere.allergies' END,
      CASE WHEN a.miss_allergies_anniversaire THEN 'occasions.anniversaire.allergies' END,
      CASE WHEN a.miss_allergies_diner_amis THEN 'occasions.diner_amis.allergies' END
    ], NULL) AS missing_fields,
    a.source_checksum,
    a.public_checksum
  FROM analysis a
  WHERE a.diff_payload = true;
$$;