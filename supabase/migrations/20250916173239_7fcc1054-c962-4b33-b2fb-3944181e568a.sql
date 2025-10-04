-- =================================================================
-- SECURITY FIX: RLS et politiques pour nouvelles tables
-- =================================================================

-- 1) Activer RLS sur les nouvelles tables
ALTER TABLE gift_idea_unsplash ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsplash_rebuild_metrics ENABLE ROW LEVEL SECURITY;

-- 2) Politiques pour gift_idea_unsplash
-- Lecture publique pour les images (nécessaire pour affichage)
CREATE POLICY "Public read access for gift ideas images"
  ON gift_idea_unsplash
  FOR SELECT
  USING (true);

-- Écriture restreinte aux services
CREATE POLICY "Service role can manage gift idea images"
  ON gift_idea_unsplash
  FOR ALL
  USING (auth.role() = 'service_role');

-- 3) Politiques pour unsplash_rebuild_metrics
-- Lecture pour utilisateurs authentifiés (monitoring)
CREATE POLICY "Authenticated users can read rebuild metrics"
  ON unsplash_rebuild_metrics
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Écriture restreinte aux services
CREATE POLICY "Service role can manage rebuild metrics"
  ON unsplash_rebuild_metrics
  FOR INSERT, UPDATE, DELETE
  USING (auth.role() = 'service_role');