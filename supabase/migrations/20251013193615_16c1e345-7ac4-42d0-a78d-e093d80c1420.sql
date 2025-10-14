-- Vider toutes les images Unsplash existantes
TRUNCATE TABLE gift_idea_unsplash;

-- Créer le bucket pour les images générées par OpenAI s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('gift-images', 'gift-images', true)
ON CONFLICT (id) DO NOTHING;

-- Politique de lecture publique pour les images
CREATE POLICY "Public can view gift images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gift-images');

-- Politique d'upload pour le service role
CREATE POLICY "Service role can upload gift images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gift-images' AND auth.role() = 'service_role');
