-- Fix constraint to allow contact_accepted notification type
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (
    type = ANY (
      ARRAY[
        'general'::text,
        'preferences_updated'::text,
        'request_accepted'::text,
        'request_received'::text,
        'event_invite'::text,
        'contact_accepted'::text
      ]
    )
  );