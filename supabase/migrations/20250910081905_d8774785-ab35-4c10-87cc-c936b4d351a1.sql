-- 0) Create app_meta table to prevent auto-seeds
CREATE TABLE IF NOT EXISTS public.app_meta(
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Lock seeds permanently
INSERT INTO public.app_meta(key, value) 
VALUES ('seed_locked', 'true')
ON CONFLICT(key) DO UPDATE SET 
  value = 'true', 
  updated_at = now();