-- Add visual tracking fields to gift_idea_unsplash table
ALTER TABLE gift_idea_unsplash 
ADD COLUMN IF NOT EXISTS visual_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS visual_intent_hash TEXT,
ADD COLUMN IF NOT EXISTS visual_source TEXT DEFAULT 'unsplash',
ADD COLUMN IF NOT EXISTS visual_confidence NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS thumb_url TEXT,
ADD COLUMN IF NOT EXISTS is_user_uploaded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false;

-- Create index for efficient regeneration queries
CREATE INDEX IF NOT EXISTS idx_gift_idea_visual_regen 
ON gift_idea_unsplash (is_user_uploaded, visual_version, last_generated_at);

-- Create table for regeneration job tracking
CREATE TABLE IF NOT EXISTS gift_regen_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL DEFAULT 'full_regeneration',
  status TEXT NOT NULL DEFAULT 'pending',
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  success_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  current_checkpoint INTEGER DEFAULT 0,
  force_regen BOOLEAN DEFAULT false,
  error_log JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE gift_regen_jobs ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage regeneration jobs
CREATE POLICY "Service role can manage regen jobs" 
ON gift_regen_jobs 
FOR ALL 
USING (auth.role() = 'service_role');

-- Policy for authenticated users to view job status
CREATE POLICY "Users can view regen job status" 
ON gift_regen_jobs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update trigger for gift_regen_jobs
CREATE OR REPLACE FUNCTION update_gift_regen_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gift_regen_jobs_updated_at
  BEFORE UPDATE ON gift_regen_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_regen_jobs_updated_at();