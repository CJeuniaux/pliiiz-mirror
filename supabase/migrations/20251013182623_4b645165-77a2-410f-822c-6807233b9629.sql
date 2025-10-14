-- Add unique constraint on place_id to support ON CONFLICT in enrich-partners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'partners_place_id_key'
      AND n.nspname = 'public'
      AND t.relname = 'partners'
  ) THEN
    ALTER TABLE public.partners
    ADD CONSTRAINT partners_place_id_key UNIQUE (place_id);
  END IF;
END $$;