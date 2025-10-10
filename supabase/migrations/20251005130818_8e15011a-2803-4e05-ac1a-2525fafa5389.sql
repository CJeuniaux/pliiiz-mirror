-- Add generation history columns to gift_idea_unsplash
ALTER TABLE gift_idea_unsplash 
ADD COLUMN IF NOT EXISTS last_prompt_positive text,
ADD COLUMN IF NOT EXISTS last_prompt_negative text,
ADD COLUMN IF NOT EXISTS generation_history jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN gift_idea_unsplash.last_prompt_positive IS 'Dernier prompt positif utilisé pour la génération';
COMMENT ON COLUMN gift_idea_unsplash.last_prompt_negative IS 'Dernier prompt négatif utilisé pour la génération';
COMMENT ON COLUMN gift_idea_unsplash.generation_history IS 'Historique des générations [{date, source, confidence, prompt}]';

-- Index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_gift_regen_jobs_status ON gift_regen_jobs(status);
CREATE INDEX IF NOT EXISTS idx_gift_regen_jobs_created_at ON gift_regen_jobs(created_at DESC);