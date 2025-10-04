-- Ensure public storage buckets and policies for avatars and user uploads

-- 1) Create buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('user-uploads', 'user-uploads', true)
on conflict (id) do nothing;

-- 2) Policies for avatars bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatars are publicly accessible'
  ) THEN
    CREATE POLICY "Avatars are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own avatar'
  ) THEN
    CREATE POLICY "Users can upload their own avatar"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own avatar'
  ) THEN
    CREATE POLICY "Users can update their own avatar"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'avatars' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own avatar'
  ) THEN
    CREATE POLICY "Users can delete their own avatar"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'avatars' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- 3) Policies for user-uploads bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'User uploads are publicly accessible'
  ) THEN
    CREATE POLICY "User uploads are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'user-uploads');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own file (user-uploads)'
  ) THEN
    CREATE POLICY "Users can upload their own file (user-uploads)"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'user-uploads' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own file (user-uploads)'
  ) THEN
    CREATE POLICY "Users can update their own file (user-uploads)"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'user-uploads' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own file (user-uploads)'
  ) THEN
    CREATE POLICY "Users can delete their own file (user-uploads)"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'user-uploads' AND 
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;