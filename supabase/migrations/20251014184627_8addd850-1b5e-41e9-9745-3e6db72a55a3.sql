-- Ajout de la colonne updated_at manquante sur requests
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Créer le trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_requests_updated_at ON public.requests;
CREATE TRIGGER update_requests_updated_at
BEFORE UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();