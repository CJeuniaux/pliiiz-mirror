-- Normalize occasion preference keys to use canonical hyphenated slugs
-- This migration converts underscored keys to hyphenated keys for consistency

UPDATE profiles 
SET occasion_prefs = (
  SELECT jsonb_object_agg(
    CASE 
      WHEN key = 'diner_entre_amis' THEN 'diner-entre-amis'
      WHEN key = 'secret_santa' THEN 'secret-santa'
      ELSE lower(replace(replace(key, '_', '-'), ' ', '-'))
    END,
    value
  )
  FROM jsonb_each(COALESCE(occasion_prefs, '{}'::jsonb))
)
WHERE occasion_prefs IS NOT NULL AND occasion_prefs != '{}'::jsonb;