-- Create event_invites table for event invitations
CREATE TABLE IF NOT EXISTS public.event_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on event_invites
ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;

-- Create policies for event_invites
CREATE POLICY "Event owners can manage invites" 
ON public.event_invites 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_invites.event_id 
    AND events.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own invites" 
ON public.event_invites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own invite status" 
ON public.event_invites 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_invites_event_id ON public.event_invites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_user_id ON public.event_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_status ON public.event_invites(status);

-- Update the handle_new_user function to be more robust with transaction handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Start transaction handling is implicit in triggers
  
  -- Use INSERT ... ON CONFLICT to ensure idempotency and prevent "Data error serving new user"
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    email, 
    email_verified,
    regift_enabled
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    first_name = COALESCE(NEW.raw_user_meta_data ->> 'first_name', profiles.first_name),
    last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', profiles.last_name),
    email = COALESCE(NEW.email, profiles.email),
    updated_at = now();
  
  -- Ensure preferences exist with JSON defaults
  INSERT INTO public.preferences (
    user_id, 
    likes, 
    dislikes, 
    allergies, 
    sizes, 
    current_wants
  )
  VALUES (
    NEW.id, 
    '{}', 
    '{}', 
    '{}', 
    '{}'::jsonb, 
    '{}'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Ensure share link exists with random slug
  INSERT INTO public.share_links (user_id, slug, is_active)
  VALUES (NEW.id, encode(gen_random_bytes(8), 'hex'), true)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- If any step fails, the entire trigger transaction will rollback automatically
  RETURN NEW;
  
EXCEPTION 
  WHEN OTHERS THEN
    -- Log the error (in a real app, you'd want proper logging)
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Re-raise to cause rollback
    RAISE;
END;
$$;