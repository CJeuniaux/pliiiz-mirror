-- Mark all existing gift idea images for regeneration with new taxonomy mapping
UPDATE gift_idea_unsplash 
SET image_status = 'pending_regen',
    image_regen_requested_at = now(),
    image_regen_reason = 'taxonomy_upgrade_v2'
WHERE image_status != 'pending_regen';

-- Log the operation
INSERT INTO app_meta (key, value, updated_at)
VALUES ('last_taxonomy_upgrade', now()::text, now())
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = EXCLUDED.updated_at;