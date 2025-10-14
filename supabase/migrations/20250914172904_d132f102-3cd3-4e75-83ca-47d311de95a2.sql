-- Fix security issues by adding search_path to functions

-- Fix function search_path issues
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_message TEXT,
  actor_id UUID DEFAULT NULL,
  notification_payload JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    message,
    actor_user_id,
    payload,
    read_at
  ) VALUES (
    target_user_id,
    notification_type,
    notification_message,
    actor_id,
    notification_payload,
    NULL
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.notifications 
  SET read_at = NOW() 
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.notifications
  WHERE user_id = auth.uid() AND read_at IS NULL;
$$;