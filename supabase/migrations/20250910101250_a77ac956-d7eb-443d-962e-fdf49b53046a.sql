-- Update events SELECT policy to allow invited users to see events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own events" ON public.events;

CREATE POLICY "Users can view own or invited events"
ON public.events
FOR SELECT
USING (
  auth.uid() = owner_id OR EXISTS (
    SELECT 1 FROM public.event_invites ei
    WHERE ei.event_id = events.id AND ei.user_id = auth.uid() AND ei.status <> 'declined'
  )
);
