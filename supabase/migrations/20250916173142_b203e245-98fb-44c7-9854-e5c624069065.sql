-- =================================================================
-- MIGRATION: Unsplash Gift Ideas v2 Rebuild System
-- =================================================================

-- 1) Table de mapping images Unsplash pour idées cadeaux
CREATE TABLE IF NOT EXISTS gift_idea_unsplash (
  id BIGSERIAL PRIMARY KEY,
  gift_idea_text TEXT NOT NULL,
  gift_idea_hash TEXT NOT NULL, -- Hash pour déduplication
  user_id UUID, -- Optionnel pour tracking
  category TEXT,
  occasion TEXT,
  unsplash_id TEXT,
  image_url TEXT,
  photographer_name TEXT,
  photographer_url TEXT,
  unsplash_url TEXT,
  query_used TEXT,
  relevance_score NUMERIC DEFAULT 0.0,
  generator_version TEXT NOT NULL DEFAULT 'v1',
  regenerated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index optimisés
CREATE INDEX IF NOT EXISTS idx_gift_idea_unsplash_hash 
  ON gift_idea_unsplash(gift_idea_hash, generator_version);
CREATE INDEX IF NOT EXISTS idx_gift_idea_unsplash_user 
  ON gift_idea_unsplash(user_id, generator_version);
CREATE INDEX IF NOT EXISTS idx_gift_idea_unsplash_version 
  ON gift_idea_unsplash(generator_version, created_at DESC);

-- 2) Table de métriques pour le rebuild
CREATE TABLE IF NOT EXISTS unsplash_rebuild_metrics (
  id BIGSERIAL PRIMARY KEY,
  rebuild_session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rebuild_metrics_session 
  ON unsplash_rebuild_metrics(rebuild_session_id, metric_name);

-- 3) Fonction helper pour hash stable
CREATE OR REPLACE FUNCTION public.stable_gift_idea_hash(idea_text TEXT, category TEXT DEFAULT NULL, occasion TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT md5(
    LOWER(TRIM(idea_text)) || '|' || 
    COALESCE(LOWER(TRIM(category)), '') || '|' || 
    COALESCE(LOWER(TRIM(occasion)), '')
  );
$$;

-- 4) Fonction pour récupérer image v2 par idée
CREATE OR REPLACE FUNCTION public.get_gift_idea_image_v2(p_idea_text TEXT, p_category TEXT DEFAULT NULL, p_occasion TEXT DEFAULT NULL)
RETURNS TABLE(
  unsplash_id TEXT,
  image_url TEXT,
  photographer_name TEXT,
  photographer_url TEXT,
  unsplash_url TEXT,
  relevance_score NUMERIC,
  is_fallback BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH idea_hash AS (
    SELECT stable_gift_idea_hash(p_idea_text, p_category, p_occasion) as hash
  )
  SELECT 
    g.unsplash_id,
    g.image_url,
    g.photographer_name,
    g.photographer_url,
    g.unsplash_url,
    g.relevance_score,
    (g.relevance_score < 0.35) as is_fallback
  FROM gift_idea_unsplash g, idea_hash
  WHERE g.gift_idea_hash = idea_hash.hash
    AND g.generator_version = 'v2'
    AND g.image_url IS NOT NULL
  ORDER BY g.created_at DESC
  LIMIT 1;
$$;

-- 5) Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_gift_idea_unsplash_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_gift_idea_unsplash_updated_at ON gift_idea_unsplash;
CREATE TRIGGER tr_gift_idea_unsplash_updated_at
  BEFORE UPDATE ON gift_idea_unsplash
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_idea_unsplash_updated_at();

-- 6) Vue pour stats rebuild
CREATE OR REPLACE VIEW v_unsplash_rebuild_stats AS
SELECT 
  COUNT(*) FILTER (WHERE generator_version = 'v1') as v1_count,
  COUNT(*) FILTER (WHERE generator_version = 'v2') as v2_count,
  COUNT(*) FILTER (WHERE generator_version = 'v2' AND image_url IS NOT NULL) as v2_success,
  COUNT(*) FILTER (WHERE generator_version = 'v2' AND image_url IS NULL) as v2_fallback,
  AVG(relevance_score) FILTER (WHERE generator_version = 'v2' AND image_url IS NOT NULL) as avg_v2_score,
  COUNT(DISTINCT gift_idea_hash) as unique_ideas
FROM gift_idea_unsplash;

-- 7) Fonction de nettoyage (pour tests)
CREATE OR REPLACE FUNCTION public.cleanup_gift_idea_unsplash_test_data()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  DELETE FROM gift_idea_unsplash WHERE gift_idea_text ILIKE '%test_%' OR gift_idea_text = 'test';
  DELETE FROM unsplash_rebuild_metrics WHERE metric_name LIKE '%test%';
$$;