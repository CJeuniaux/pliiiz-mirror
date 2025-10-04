-- Create tables with proper RLS for data isolation

-- Update profiles table to ensure proper structure
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create preferences table
CREATE TABLE IF NOT EXISTS public.preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  likes TEXT[] DEFAULT '{}',
  dislikes TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  sizes JSONB DEFAULT '{}',
  current_wants TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  relation TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create share_links table
CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for preferences
CREATE POLICY "Users can view their own preferences" ON public.preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" ON public.preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON public.preferences
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contacts
CREATE POLICY "Users can view their own contacts" ON public.contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON public.contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON public.contacts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for share_links
CREATE POLICY "Users can view their own share_links" ON public.share_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own share_links" ON public.share_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own share_links" ON public.share_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own share_links" ON public.share_links
  FOR DELETE USING (auth.uid() = user_id);

-- Public policy for shared profile viewing
CREATE POLICY "Allow public to view active shared profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.share_links 
      WHERE share_links.user_id = profiles.user_id 
      AND share_links.is_active = true
    )
  );

CREATE POLICY "Allow public to view preferences of shared profiles" ON public.preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.share_links 
      WHERE share_links.user_id = preferences.user_id 
      AND share_links.is_active = true
    )
  );

-- Update triggers for timestamps
CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON public.preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_share_links_updated_at
  BEFORE UPDATE ON public.share_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update the handle_new_user function to create empty records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, first_name, last_name, email, email_verified)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  );
  
  -- Create empty preferences
  INSERT INTO public.preferences (user_id, likes, dislikes, allergies, sizes, current_wants)
  VALUES (NEW.id, '{}', '{}', '{}', '{}', '{}');
  
  -- Create share link with random slug
  INSERT INTO public.share_links (user_id, slug, is_active)
  VALUES (NEW.id, encode(gen_random_bytes(8), 'hex'), true);
  
  RETURN NEW;
END;
$function$;