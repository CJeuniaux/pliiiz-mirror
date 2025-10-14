-- =================================================================
-- SECURITY FIX: RLS et politiques pour nouvelles tables (syntaxe corrigée)
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

-- Écriture INSERT restreinte aux services
CREATE POLICY "Service role can insert rebuild metrics"
  ON unsplash_rebuild_metrics
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Écriture UPDATE restreinte aux services
CREATE POLICY "Service role can update rebuild metrics"
  ON unsplash_rebuild_metrics
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Écriture DELETE restreinte aux services
CREATE POLICY "Service role can delete rebuild metrics"
  ON unsplash_rebuild_metrics
  FOR DELETE
  USING (auth.role() = 'service_role');