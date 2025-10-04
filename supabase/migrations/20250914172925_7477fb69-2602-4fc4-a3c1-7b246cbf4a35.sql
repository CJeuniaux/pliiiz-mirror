-- Add new columns to notifications table for enhanced functionality
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS actor_user_id UUID,
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

-- Update existing notifications to have proper type values
UPDATE public.notifications 
SET type = 'general' 
WHERE type IS NULL OR type = '';

-- Add check constraint for notification types
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('general', 'preferences_updated', 'request_accepted', 'request_received', 'event_invite'));

-- Create index for better performance on read_at queries
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_message TEXT,
  actor_id UUID DEFAULT NULL,
  notification_payload JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications 
  SET read_at = NOW() 
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$;

-- Function to get unread count
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.notifications
  WHERE user_id = auth.uid() AND read_at IS NULL;
$$;