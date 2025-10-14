-- Create or update partners table with all required fields
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  category text NOT NULL,
  place_id text UNIQUE,
  formatted_address text,
  website text,
  google_maps_url text,
  phone text,
  lat double precision,
  lng double precision,
  rating numeric,
  user_ratings_total integer,
  regift_compatible boolean DEFAULT false,
  status text DEFAULT 'active',
  notes text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on place_id
CREATE UNIQUE INDEX IF NOT EXISTS ux_partners_place_id ON public.partners(place_id);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_partners_location ON public.partners(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_partners_category ON public.partners(category);

-- Update RLS policies for partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Allow public read access (partners are public information)
DROP POLICY IF EXISTS "Partners are viewable by everyone" ON public.partners;
CREATE POLICY "Partners are viewable by everyone" 
ON public.partners FOR SELECT 
USING (true);

-- Only service role can manage partners data
DROP POLICY IF EXISTS "Service role can manage partners" ON public.partners;
CREATE POLICY "Service role can manage partners" 
ON public.partners FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_partners_updated_at ON public.partners;
CREATE TRIGGER trigger_update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_partners_updated_at();