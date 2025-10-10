-- Nettoyer les données des préférences par occasion
UPDATE profiles 
SET occasion_prefs = '{}' 
WHERE occasion_prefs IS NOT NULL AND occasion_prefs != '{}';

-- Mettre à jour les utilisateurs existants pour s'assurer que global_preferences a la bonne structure
UPDATE profiles 
SET global_preferences = jsonb_build_object(
  'likes', COALESCE(global_preferences->'likes', '[]'::jsonb),
  'avoid', COALESCE(global_preferences->'avoid', global_preferences->'dislikes', '[]'::jsonb),
  'giftIdeas', COALESCE(global_preferences->'giftIdeas', global_preferences->'gift_ideas', '[]'::jsonb),
  'sizes', COALESCE(global_preferences->'sizes', '{}'::jsonb),
  'brands', '[]'::jsonb,
  'notes', COALESCE(global_preferences->>'notes', '')
)
WHERE global_preferences IS NOT NULL;