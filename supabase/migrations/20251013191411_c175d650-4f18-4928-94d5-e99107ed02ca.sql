-- Function to check if two users are contacts
CREATE OR REPLACE FUNCTION public.check_contact_relationship(contact_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE (c.owner_id = auth.uid() AND c.contact_user_id = contact_user_id)
       OR (c.contact_user_id = auth.uid() AND c.owner_id = contact_user_id)
  );
$$;