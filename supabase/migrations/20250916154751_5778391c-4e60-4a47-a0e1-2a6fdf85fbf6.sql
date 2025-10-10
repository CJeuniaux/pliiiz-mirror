-- 1) SIGNUP V2 - Base components seulement (éviter le deadlock)
-- Créer table pour l'idempotency des requests
CREATE TABLE IF NOT EXISTS public.request_log (
    id BIGSERIAL PRIMARY KEY,
    idempotency_key TEXT UNIQUE NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_request_log_created_at ON public.request_log(created_at);

-- RLS pour request_log
ALTER TABLE public.request_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage request_log" ON public.request_log
FOR ALL USING (auth.role() = 'service_role'::text);

-- Fonction helper pour nettoyer les données d'inscription
CREATE OR REPLACE FUNCTION public.normalize_signup_data(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN jsonb_build_object(
        'email', LOWER(TRIM(p_email)),
        'first_name', CASE 
            WHEN p_first_name IS NULL OR TRIM(p_first_name) = '' THEN 'Utilisateur'
            ELSE TRIM(p_first_name)
        END,
        'last_name', CASE 
            WHEN p_last_name IS NULL OR TRIM(p_last_name) = '' THEN NULL
            ELSE TRIM(p_last_name)
        END,
        'city', CASE 
            WHEN p_city IS NULL OR TRIM(p_city) = '' THEN NULL
            ELSE TRIM(p_city)
        END,
        'country', CASE 
            WHEN p_country IS NULL OR TRIM(p_country) = '' THEN NULL
            ELSE TRIM(p_country)
        END
    );
END;
$$;