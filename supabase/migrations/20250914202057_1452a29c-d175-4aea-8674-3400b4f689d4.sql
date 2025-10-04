-- Add missing columns to existing partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS place_id text,
ADD COLUMN IF NOT EXISTS formatted_address text,
ADD COLUMN IF NOT EXISTS google_maps_url text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS rating numeric,
ADD COLUMN IF NOT EXISTS user_ratings_total integer,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS logo_url text;

-- Create unique index on place_id
CREATE UNIQUE INDEX IF NOT EXISTS ux_partners_place_id ON public.partners(place_id) WHERE place_id IS NOT NULL;

-- Create index for location-based queries  
CREATE INDEX IF NOT EXISTS idx_partners_location ON public.partners(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_partners_category ON public.partners(category);

-- Update RLS policies - remove restrictive policy and allow public read
DROP POLICY IF EXISTS "Service role can manage partners" ON public.partners;
DROP POLICY IF EXISTS "Partners are viewable by everyone" ON public.partners;

CREATE POLICY "Partners are viewable by everyone" 
ON public.partners FOR SELECT 
USING (true);

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