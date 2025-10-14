-- Migration: Système de régénération d'images optimisé
-- Colonnes pour profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_path text,
  ADD COLUMN IF NOT EXISTS avatar_hash text,
  ADD COLUMN IF NOT EXISTS avatar_version integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avatar_blurhash text,
  ADD COLUMN IF NOT EXISTS avatar_dominant text,
  ADD COLUMN IF NOT EXISTS avatar_last_regen timestamptz;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_hash ON public.profiles(avatar_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_last_regen ON public.profiles(avatar_last_regen);

-- Table de jobs de régénération
CREATE TABLE IF NOT EXISTS public.image_regen_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'error')),
  attempts integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_image_regen_jobs_status ON public.image_regen_jobs(status);
CREATE INDEX IF NOT EXISTS idx_image_regen_jobs_profile ON public.image_regen_jobs(profile_id);

-- Empêcher les doublons de jobs actifs pour un même profil
CREATE UNIQUE INDEX IF NOT EXISTS idx_image_regen_jobs_active 
  ON public.image_regen_jobs(profile_id) 
  WHERE status IN ('queued', 'running');

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_image_regen_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_image_regen_jobs_updated_at ON public.image_regen_jobs;
CREATE TRIGGER trg_image_regen_jobs_updated_at
  BEFORE UPDATE ON public.image_regen_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_image_regen_jobs_updated_at();

-- RLS pour image_regen_jobs
ALTER TABLE public.image_regen_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage image_regen_jobs" ON public.image_regen_jobs;
CREATE POLICY "Service role can manage image_regen_jobs"
  ON public.image_regen_jobs
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can view image_regen_jobs" ON public.image_regen_jobs;
CREATE POLICY "Admins can view image_regen_jobs"
  ON public.image_regen_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );