-- Create a table to log gift image generation for debugging
CREATE TABLE IF NOT EXISTS public.gift_images_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_name TEXT NOT NULL,
  gift_type TEXT DEFAULT 'default',
  prompt_positive TEXT NOT NULL,
  prompt_negative TEXT,
  model TEXT DEFAULT 'gpt-image-1',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on gift_images_logs
ALTER TABLE public.gift_images_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for gift_images_logs
CREATE POLICY "Users can view their own gift image logs"
  ON public.gift_images_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gift image logs"
  ON public.gift_images_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to safely create bidirectional contacts
CREATE OR REPLACE FUNCTION public.create_bidirectional_contact(
  contact_email TEXT,
  relation_type TEXT DEFAULT 'friend'
)
RETURNS VOID AS $$
DECLARE
  contact_user_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Find contact by email
  SELECT user_id INTO contact_user_id 
  FROM public.profiles 
  WHERE email = contact_email;
  
  IF contact_user_id IS NULL THEN
    RAISE EXCEPTION 'Contact not found with email: %', contact_email;
  END IF;
  
  -- Prevent self-linking
  IF current_user_id = contact_user_id THEN
    RAISE EXCEPTION 'Cannot link to yourself';
  END IF;
  
  -- Create bidirectional relationship
  INSERT INTO public.contacts (owner_id, contact_user_id, alias)
  VALUES 
    (current_user_id, contact_user_id, NULL),
    (contact_user_id, current_user_id, NULL)
  ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;