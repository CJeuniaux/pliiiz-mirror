-- Create table for logging gift image generation attempts
CREATE TABLE IF NOT EXISTS public.gift_images_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gift_name TEXT NOT NULL,
  gift_type TEXT DEFAULT 'default',
  prompt_positive TEXT NOT NULL,
  prompt_negative TEXT,
  model TEXT DEFAULT 'gpt-image-1',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_images_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own gift image logs" 
ON public.gift_images_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gift image logs" 
ON public.gift_images_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);