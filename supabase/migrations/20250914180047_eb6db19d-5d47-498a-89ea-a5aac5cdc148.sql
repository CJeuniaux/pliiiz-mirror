-- Create public storage bucket for image library
INSERT INTO storage.buckets (id, name, public) VALUES ('library', 'library', true);

-- Create image library table for curated images
CREATE TABLE IF NOT EXISTS public.image_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,                         -- human label, e.g. "thé vert en vrac"
  category_id TEXT,                            -- e.g. "tea", "chocolate", "books"
  attrs JSONB,                                 -- e.g. {"type":"green","form":"loose-leaf"}
  image_url TEXT NOT NULL,                     -- public URL (Storage "library/" or "ai-previews/")
  source TEXT DEFAULT 'upload',                -- 'upload' | 'stock' | 'ai'
  license TEXT,                                -- optional note
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on image library
ALTER TABLE public.image_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for image library
CREATE POLICY "Image library is viewable by everyone" 
ON public.image_library 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert into image library" 
ON public.image_library 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update image library" 
ON public.image_library 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create storage policies for library bucket
CREATE POLICY "Library images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'library');

CREATE POLICY "Authenticated users can upload to library" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'library' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update library files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'library' AND auth.uid() IS NOT NULL);

-- Fast lookups indexes
CREATE INDEX IF NOT EXISTS idx_image_library_label ON public.image_library (lower(label));
CREATE INDEX IF NOT EXISTS idx_image_library_category ON public.image_library (category_id);
CREATE INDEX IF NOT EXISTS idx_image_library_attrs ON public.image_library USING GIN (attrs);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_image_library_updated_at
BEFORE UPDATE ON public.image_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some seed data
INSERT INTO public.image_library (label, category_id, attrs, image_url, source, license) VALUES
('thé vert en vrac', 'tea', '{"type":"green","form":"loose-leaf"}', 'https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library/tea_green_loose.jpg', 'stock', 'royalty-free'),
('chocolat noir 70% praliné', 'chocolate', '{"type":"dark","cocoaPct":70,"fill":"praline"}', 'https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library/chocolate_dark_70_praline.jpg', 'stock', 'royalty-free'),
('roman policier', 'books', '{"genre":"policier"}', 'https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library/book_crime.jpg', 'stock', 'royalty-free'),
('bougie parfum boisé', 'home_bougies', '{"parfum":"boisé"}', 'https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library/candle_woody.jpg', 'stock', 'royalty-free'),
('écouteurs true wireless', 'tech_audio', '{"type":"tws"}', 'https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library/earbuds_tws.jpg', 'stock', 'royalty-free'),
('plante succulente', 'plants', '{"type":"succulent"}', 'https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library/plant_succulent.jpg', 'stock', 'royalty-free');