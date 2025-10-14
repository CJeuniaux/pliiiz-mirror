-- Amélioration complète de la gestion des uploads publics

-- 1) S'assurer que tous les uploads ont is_public défini correctement
UPDATE public.user_uploads 
SET is_public = TRUE 
WHERE is_public IS NULL;

-- 2) Améliorer l'index pour les requêtes du worker
DROP INDEX IF EXISTS idx_user_uploads_public;
CREATE INDEX IF NOT EXISTS idx_user_uploads_public_optimized
  ON public.user_uploads(user_id, is_public, created_at DESC)
  WHERE is_public = true;

-- 3) Nettoyer les chemins des URLs existantes (fallback robuste)
UPDATE public.user_uploads 
SET path = CASE
  WHEN path IS NULL AND url IS NOT NULL THEN
    CASE
      WHEN url ~ '^https?://[^/]+/storage/v1/object/public/user-uploads/(.+)' THEN
        regexp_replace(url, '^https?://[^/]+/storage/v1/object/public/user-uploads/(.+?)(\?.*)?$', '\1')
      WHEN url ~ '^/storage/v1/object/public/user-uploads/(.+)' THEN
        regexp_replace(url, '^/storage/v1/object/public/user-uploads/(.+?)(\?.*)?$', '\1')
      ELSE NULL
    END
  ELSE path
END
WHERE path IS NULL;

-- 4) Garantir que kind a une valeur par défaut
UPDATE public.user_uploads 
SET kind = 'gift_idea' 
WHERE kind IS NULL;

-- 5) Forcer la reconstitution des profils publics via outbox
INSERT INTO public.replication_outbox (user_id, event_type, source_version, payload, idempotency_key)
SELECT 
  u.id,
  'UPSERT_PROFILE',
  1,
  jsonb_build_object('user_id', u.id, 'trigger', 'media_backfill'),
  'backfill_media_' || u.id || '_' || extract(epoch from now())::bigint
FROM auth.users u
WHERE EXISTS (
  SELECT 1 FROM public.user_uploads uu 
  WHERE uu.user_id = u.id 
  AND uu.is_public = true 
  AND uu.path IS NOT NULL
)
ON CONFLICT (idempotency_key) DO NOTHING;

-- 6) Métriques de diagnostic
INSERT INTO public.app_meta (key, value, updated_at) VALUES
  ('media_backfill_timestamp', extract(epoch from now())::text, now()),
  ('uploads_with_path_count', (SELECT count(*)::text FROM public.user_uploads WHERE path IS NOT NULL), now()),
  ('public_uploads_count', (SELECT count(*)::text FROM public.user_uploads WHERE is_public = true), now())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = EXCLUDED.updated_at;