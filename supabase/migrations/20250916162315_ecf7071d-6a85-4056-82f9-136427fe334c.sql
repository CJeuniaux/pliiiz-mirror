-- 1) Extend user_uploads with public media metadata
ALTER TABLE public.user_uploads
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS width INT,
  ADD COLUMN IF NOT EXISTS height INT,
  ADD COLUMN IF NOT EXISTS path TEXT;

-- 2) Helpful indexes for queries by worker
CREATE INDEX IF NOT EXISTS idx_user_uploads_user ON public.user_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_public ON public.user_uploads(user_id, is_public);

-- 3) Backfill path from existing absolute URLs when possible (best-effort)
-- This assumes URLs like `${SUPABASE_URL}/storage/v1/object/public/user-uploads/<path>`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='user_uploads' AND column_name='url'
  ) THEN
    UPDATE public.user_uploads
    SET path = CASE 
      WHEN url LIKE '%/object/public/user-uploads/%' 
        THEN split_part(url, '/object/public/user-uploads/', 2)
      ELSE path
    END
    WHERE path IS NULL;
  END IF;
END $$;
