-- Create outbox pattern for reliable profile replication
-- Table pour l'outbox transactionnelle
CREATE TABLE IF NOT EXISTS public.replication_outbox (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('UPSERT_PROFILE', 'DELETE_PROFILE')),
  source_version BIGINT NOT NULL DEFAULT 1,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  idempotency_key TEXT NOT NULL
);

-- Index pour le processing FIFO et la performance
CREATE INDEX IF NOT EXISTS idx_outbox_processing ON public.replication_outbox (processed_at NULLS FIRST, created_at);
CREATE INDEX IF NOT EXISTS idx_outbox_user_id ON public.replication_outbox (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_outbox_idempotency ON public.replication_outbox (idempotency_key);

-- Table pour tracker les versions et checksums des profils publics
CREATE TABLE IF NOT EXISTS public.public_profile_versions (
  user_id UUID PRIMARY KEY,
  version BIGINT NOT NULL DEFAULT 1,
  checksum TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les métriques de réplication
CREATE TABLE IF NOT EXISTS public.replication_metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initialiser les métriques de base
INSERT INTO public.replication_metrics (metric_name, metric_value) VALUES
('replicated_ok', 0),
('replicated_fail', 0),
('reconciliation_runs', 0),
('outbox_size', 0)
ON CONFLICT DO NOTHING;

-- Fonction pour calculer le checksum d'un profil
CREATE OR REPLACE FUNCTION public.calculate_profile_checksum(profile_data JSONB)
RETURNS TEXT AS $$
BEGIN
  RETURN md5(profile_data::text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour créer l'idempotency key
CREATE OR REPLACE FUNCTION public.generate_profile_idempotency_key(p_user_id UUID, p_version BIGINT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'profile_' || p_user_id::text || '_v' || p_version::text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;