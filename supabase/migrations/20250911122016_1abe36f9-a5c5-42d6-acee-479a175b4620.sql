-- Add contact-based RLS policy for preferences
CREATE POLICY IF NOT EXISTS "contacts_can_view_preferences"
ON public.preferences
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE (c.owner_id = auth.uid() AND c.contact_user_id = preferences.user_id)
       OR (c.contact_user_id = auth.uid() AND c.owner_id = preferences.user_id)
  )
);