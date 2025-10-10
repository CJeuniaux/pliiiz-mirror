-- Corriger les avertissements de sécurité

-- Modifier les fonctions existantes pour ajouter search_path
ALTER FUNCTION public.build_public_payload_v2(v_public_profile_source) 
SET search_path = public;

ALTER FUNCTION public.calculate_profile_checksum(jsonb) 
SET search_path = public;

ALTER FUNCTION public.generate_profile_idempotency_key(uuid, bigint) 
SET search_path = public;