-- Create ai-previews storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ai-previews', 'ai-previews', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for ai-previews bucket
CREATE POLICY "Allow public read access to ai-previews" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ai-previews');

CREATE POLICY "Allow authenticated insert to ai-previews" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ai-previews' AND auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to ai-previews" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'ai-previews' AND auth.role() = 'service_role');