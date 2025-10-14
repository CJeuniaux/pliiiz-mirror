-- Create user_uploads table for storing user's uploaded images
CREATE TABLE IF NOT EXISTS public.user_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  kind TEXT DEFAULT 'gift',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient querying by user and created_at
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_created 
ON public.user_uploads(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;

-- Users can view their own uploads
CREATE POLICY "Users can view their own uploads" 
ON public.user_uploads 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own uploads
CREATE POLICY "Users can insert their own uploads" 
ON public.user_uploads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own uploads
CREATE POLICY "Users can update their own uploads" 
ON public.user_uploads 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own uploads
CREATE POLICY "Users can delete their own uploads" 
ON public.user_uploads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Contacts can view each other's uploads
CREATE POLICY "Contacts can view uploads" 
ON public.user_uploads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM contacts c 
    WHERE (c.owner_id = auth.uid() AND c.contact_user_id = user_uploads.user_id)
       OR (c.contact_user_id = auth.uid() AND c.owner_id = user_uploads.user_id)
  )
);

-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user uploads
CREATE POLICY "Users can view user uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-uploads');

CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'user-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'user-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);