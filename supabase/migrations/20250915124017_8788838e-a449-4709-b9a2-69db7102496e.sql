-- Vérifier et ajouter les colonnes nécessaires
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS actor_user_id uuid,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Supprimer l'ancienne colonne 'read' booléenne si elle existe
ALTER TABLE public.notifications DROP COLUMN IF EXISTS read;

-- FK douce vers auth.users
DO $$ BEGIN
  ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_actor_fk
    FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index pour le compteur non-lues
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications (user_id, read_at)
  WHERE read_at IS NULL;

-- Activer la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- RPC enrichie pour récupérer les notifications avec les infos des acteurs
CREATE OR REPLACE FUNCTION public.get_notifications_enriched(p_limit int DEFAULT 50, p_offset int DEFAULT 0)
RETURNS TABLE (
  id uuid, 
  type text, 
  message text,
  payload jsonb, 
  created_at timestamptz,
  actor_user_id uuid, 
  actor_name text, 
  actor_avatar text, 
  read_at timestamptz
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path=public AS $$
  SELECT 
    n.id, 
    n.type, 
    n.message,
    n.payload, 
    n.created_at,
    n.actor_user_id,
    COALESCE(
      CASE 
        WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL 
        THEN p.first_name || ' ' || p.last_name
        WHEN p.first_name IS NOT NULL 
        THEN p.first_name
        ELSE 'Un utilisateur'
      END
    ) as actor_name,
    p.avatar_url as actor_avatar,
    n.read_at
  FROM public.notifications n
  LEFT JOIN public.profiles p ON p.user_id = n.actor_user_id
  WHERE n.user_id = auth.uid()
  ORDER BY n.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- RPC pour compter les notifications non-lues
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS integer 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path=public AS $$
  SELECT COUNT(*)::int 
  FROM public.notifications
  WHERE user_id = auth.uid() AND read_at IS NULL;
$$;

-- RPC pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS void 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path=public AS $$
  UPDATE public.notifications
  SET read_at = NOW()
  WHERE id = p_notification_id AND user_id = auth.uid() AND read_at IS NULL;
$$;

-- RPC pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path=public AS $$
  UPDATE public.notifications
  SET read_at = NOW()
  WHERE user_id = auth.uid() AND read_at IS NULL;
$$;

-- Permissions sur les RPC
GRANT EXECUTE ON FUNCTION
  public.get_notifications_enriched(int, int),
  public.get_unread_notifications_count(),
  public.mark_notification_read(uuid),
  public.mark_all_notifications_read()
TO authenticated;