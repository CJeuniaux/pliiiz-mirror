-- Ajout des colonnes pour dénormaliser les données d'acteur
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS actor_name TEXT,
  ADD COLUMN IF NOT EXISTS actor_avatar_url TEXT;

-- Index optimisé pour la boîte de réception
CREATE INDEX IF NOT EXISTS idx_notifications_inbox
  ON notifications (user_id, read_at NULLS FIRST, created_at DESC);

-- Fonction mise à jour pour créer une notification avec snapshot acteur
CREATE OR REPLACE FUNCTION public.create_notification_with_actor(
  target_user_id uuid, 
  notification_type text, 
  notification_message text, 
  actor_id uuid DEFAULT NULL::uuid, 
  notification_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
  actor_name_snapshot TEXT;
  actor_avatar_snapshot TEXT;
BEGIN
  -- Récupère les données snapshot de l'acteur si fourni
  IF actor_id IS NOT NULL THEN
    SELECT 
      COALESCE(first_name || ' ' || COALESCE(last_name, ''), first_name, last_name, 'Utilisateur'),
      avatar_url
    INTO actor_name_snapshot, actor_avatar_snapshot
    FROM profiles 
    WHERE user_id = actor_id;
  END IF;

  -- Crée la notification avec snapshot
  INSERT INTO public.notifications (
    user_id,
    type,
    message,
    actor_user_id,
    actor_name,
    actor_avatar_url,
    payload,
    read_at
  ) VALUES (
    target_user_id,
    notification_type,
    notification_message,
    actor_id,
    actor_name_snapshot,
    actor_avatar_snapshot,
    notification_payload,
    NULL
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Backfill des notifications existantes sans snapshot acteur
UPDATE notifications n
SET 
  actor_name = COALESCE(p.first_name || ' ' || COALESCE(p.last_name, ''), p.first_name, p.last_name, 'Utilisateur'),
  actor_avatar_url = p.avatar_url
FROM profiles p
WHERE n.actor_user_id = p.user_id
  AND n.actor_name IS NULL
  AND n.actor_user_id IS NOT NULL;