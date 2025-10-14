-- 1. Corriger la contrainte image_status pour accepter 'pending'
ALTER TABLE gift_idea_unsplash DROP CONSTRAINT IF EXISTS gift_idea_unsplash_image_status_check;
ALTER TABLE gift_idea_unsplash 
  ADD CONSTRAINT gift_idea_unsplash_image_status_check 
  CHECK (image_status IN ('ok', 'error', 'pending', 'pending_regen', 'generating'));

-- 2. Mettre à jour les entrées existantes sans image pour forcer la régénération
UPDATE gift_idea_unsplash 
SET image_status = 'pending',
    image_url = NULL,
    unsplash_id = NULL
WHERE (image_url IS NULL OR image_url = '') 
  AND generator_version = 'v2';