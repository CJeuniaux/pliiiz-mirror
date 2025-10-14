-- Ajouter colonnes de suivi de génération d'image sur gift_idea_unsplash
ALTER TABLE gift_idea_unsplash
ADD COLUMN IF NOT EXISTS image_status text DEFAULT 'ok',
ADD COLUMN IF NOT EXISTS image_regen_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS image_regen_reason text;

-- Contrainte pour les statuts valides
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'gift_idea_unsplash_image_status_check'
  ) THEN
    ALTER TABLE gift_idea_unsplash 
    ADD CONSTRAINT gift_idea_unsplash_image_status_check 
    CHECK (image_status IN ('ok', 'queued', 'generating', 'failed'));
  END IF;
END $$;

-- RPC pour demander régénération d'une image cadeau (admin only)
CREATE OR REPLACE FUNCTION request_gift_image_regen(
  gift_idea_id bigint,
  reason text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  updated_count int;
BEGIN
  -- Vérifier que l'appelant est admin
  SELECT public.has_role(auth.uid(), 'admin') INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  
  -- Marquer l'image pour régénération
  UPDATE gift_idea_unsplash
  SET 
    image_status = 'queued',
    image_regen_requested_at = now(),
    image_regen_reason = reason,
    updated_at = now()
  WHERE id = gift_idea_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'Gift idea not found with id %', gift_idea_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'gift_idea_id', gift_idea_id,
    'status', 'queued',
    'queued_at', now()
  );
END;
$$;

COMMENT ON FUNCTION request_gift_image_regen IS 'Queue gift image regeneration (admin only)';

-- Index pour performance sur les images en attente
CREATE INDEX IF NOT EXISTS idx_gift_idea_unsplash_image_status 
ON gift_idea_unsplash(image_status) 
WHERE image_status != 'ok';