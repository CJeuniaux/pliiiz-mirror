-- 1) SIGNUP V2 - Table pour idempotency et contraintes
-- Ajouter table pour l'idempotency des requests
CREATE TABLE IF NOT EXISTS public.request_log (
    id BIGSERIAL PRIMARY KEY,
    idempotency_key TEXT UNIQUE NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_request_log_created_at ON public.request_log(created_at);

-- Ajouter contrainte UNIQUE sur email si elle n'existe pas
DO $$ 
BEGIN
    -- Vérifier si la contrainte existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_email_uk' 
        AND table_name = 'profiles'
    ) THEN
        -- Nettoyer d'abord les doublons potentiels (garder le plus récent)
        WITH duplicates AS (
            SELECT user_id, email, 
                   ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
            FROM profiles 
            WHERE email IS NOT NULL AND email != ''
        )
        DELETE FROM profiles 
        WHERE user_id IN (
            SELECT user_id FROM duplicates WHERE rn > 1
        );
        
        -- Ajouter la contrainte
        ALTER TABLE profiles ADD CONSTRAINT users_email_uk UNIQUE(email);
    END IF;
END $$;

-- Ajouter contrainte pour display_name non vide si pas déjà présente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'profiles_display_name_not_empty'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_display_name_not_empty 
        CHECK (first_name IS NULL OR char_length(trim(first_name)) > 0);
    END IF;
END $$;

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
            WHEN p_first_name IS NULL OR TRIM(p_first_name) = '' THEN NULL
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