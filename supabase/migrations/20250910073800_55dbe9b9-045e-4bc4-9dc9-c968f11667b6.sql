-- Migration complète pour app PLIIIZ fonctionnelle selon brief
-- Tables et relations selon §3 du brief

-- 1. Mise à jour table profiles avec colonnes regift selon §10
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS regift_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS regift_note TEXT;

-- 2. Table events selon brief
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE,
  location_text TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Table requests selon brief
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Table notifications selon brief
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  ref_id UUID,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Table partners selon brief
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  address TEXT,
  url TEXT,
  google_place_id TEXT,
  regift_compatible BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Table regift_listings pour §10
CREATE TABLE IF NOT EXISTS public.regift_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  estimated_value DECIMAL(10,2),
  condition TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regift_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour events
CREATE POLICY "Users can view their own events" ON public.events FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create their own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own events" ON public.events FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own events" ON public.events FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies pour requests
CREATE POLICY "Users can view requests they sent or received" ON public.requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can create requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update requests they received" ON public.requests FOR UPDATE USING (auth.uid() = to_user_id);

-- RLS Policies pour notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies pour partners (public read)
CREATE POLICY "Partners are viewable by everyone" ON public.partners FOR SELECT USING (true);

-- RLS Policies pour regift_listings
CREATE POLICY "Users can view available regift listings" ON public.regift_listings FOR SELECT USING (available = true OR auth.uid() = user_id);
CREATE POLICY "Users can create their own regift listings" ON public.regift_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own regift listings" ON public.regift_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own regift listings" ON public.regift_listings FOR DELETE USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_regift_listings_updated_at BEFORE UPDATE ON public.regift_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour récupérer les profils publics avec regift info (selon §10)
CREATE OR REPLACE FUNCTION public.get_public_profile_with_regift(profile_user_id uuid)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  first_name text, 
  last_name text, 
  bio text,
  regift_enabled boolean,
  regift_note text,
  language text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.bio,
    p.regift_enabled,
    p.regift_note,
    p.language,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.user_id = profile_user_id
    AND EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.user_id = profile_user_id 
      AND sl.is_active = true
    );
$function$;

-- Insérer des données de test pour partners (quelques exemples)
INSERT INTO public.partners (name, lat, lng, address, regift_compatible) VALUES
('Green Shop', 50.8503, 4.3517, 'Rue Neuve 123, Bruxelles', true),
('Eco Store', 50.8476, 4.3572, 'Avenue Louise 456, Bruxelles', true),
('Classic Gifts', 50.8505, 4.3488, 'Rue des Bouchers 789, Bruxelles', false)
ON CONFLICT DO NOTHING;