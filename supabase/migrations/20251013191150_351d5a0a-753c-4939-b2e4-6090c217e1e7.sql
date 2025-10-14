DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'contacts_can_view_profiles'
  ) THEN
    CREATE POLICY "contacts_can_view_profiles"
    ON public.profiles
    FOR SELECT
    USING (
      auth.uid() = user_id
      OR EXISTS (
        SELECT 1 FROM public.share_links sl
        WHERE sl.user_id = profiles.user_id AND sl.is_active = true
      )
      OR EXISTS (
        SELECT 1 FROM public.contacts c
        WHERE (c.owner_id = auth.uid() AND c.contact_user_id = profiles.user_id)
           OR (c.contact_user_id = auth.uid() AND c.owner_id = profiles.user_id)
      )
    );
  END IF;
END $$;