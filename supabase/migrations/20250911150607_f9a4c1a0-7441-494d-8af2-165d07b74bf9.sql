-- Correction de la migration regifts avec les bonnes références de colonnes

-- Table des regifts corrigée
CREATE TABLE IF NOT EXISTS public.regifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL, -- Référence vers un cadeau (à créer si pas encore fait)
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_contact_id UUID NOT NULL, -- Référence vers un contact (table contacts par ID)
  status TEXT NOT NULL CHECK (status IN ('suggested', 'accepted', 'declined')) DEFAULT 'suggested',
  reason TEXT,
  visibility TEXT NOT NULL CHECK (visibility IN ('private', 'friends')) DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regifts ENABLE ROW LEVEL SECURITY;

-- Policies pour regifts corrigées
CREATE POLICY "Users can view their own regifts (sent or received)" 
ON public.regifts 
FOR SELECT 
USING (
  auth.uid() = from_user_id OR 
  auth.uid() IN (
    SELECT owner_id FROM public.contacts 
    WHERE id = to_contact_id
  )
);

CREATE POLICY "Users can create their own regift suggestions" 
ON public.regifts 
FOR INSERT 
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients can update regift status" 
ON public.regifts 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.contacts 
    WHERE id = to_contact_id
  )
);

-- Table des cadeaux si elle n'existe pas encore
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('available', 'reserved', 'regifted')) DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS pour gifts
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Policies pour gifts
CREATE POLICY "Users can view their own gifts and regifted ones" 
ON public.gifts 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  id IN (
    SELECT gift_id FROM public.regifts 
    WHERE auth.uid() IN (
      SELECT owner_id FROM public.contacts 
      WHERE id = to_contact_id
    )
  )
);

CREATE POLICY "Users can manage their own gifts" 
ON public.gifts 
FOR ALL 
USING (auth.uid() = user_id);

-- Triggers pour updated_at (réutilise la fonction existante)
CREATE TRIGGER update_regifts_updated_at
  BEFORE UPDATE ON public.regifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gifts_updated_at
  BEFORE UPDATE ON public.gifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_regifts_from_user ON public.regifts(from_user_id);
CREATE INDEX IF NOT EXISTS idx_regifts_to_contact ON public.regifts(to_contact_id);
CREATE INDEX IF NOT EXISTS idx_regifts_status ON public.regifts(status);
CREATE INDEX IF NOT EXISTS idx_gifts_user ON public.gifts(user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON public.gifts(status);