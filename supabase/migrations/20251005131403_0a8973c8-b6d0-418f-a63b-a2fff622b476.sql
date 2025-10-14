-- Système de rôles sécurisé (table séparée)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies pour user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Only service role can manage roles"
  ON public.user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fonction security definer pour vérifier le rôle
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Colonnes pour tracking de régénération avatar
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_status text DEFAULT 'ok' CHECK (avatar_status IN ('ok', 'queued', 'processing', 'failed')),
ADD COLUMN IF NOT EXISTS avatar_regen_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS avatar_regen_reason text;

-- RPC pour demander régénération (admin only)
CREATE OR REPLACE FUNCTION request_avatar_regen(
  target_user uuid,
  reason text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  updated_count int;
BEGIN
  -- Vérifier que l'appelant est admin
  SELECT public.has_role(auth.uid(), 'admin') INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  
  -- Marquer le profil pour régénération
  UPDATE profiles
  SET 
    avatar_status = 'queued',
    avatar_regen_requested_at = now(),
    avatar_regen_reason = reason,
    updated_at = now()
  WHERE user_id = target_user;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'Profile not found for user %', target_user;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user,
    'status', 'queued',
    'queued_at', now()
  );
END;
$$;

COMMENT ON FUNCTION request_avatar_regen IS 'Queue avatar regeneration for a user (admin only)';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_status ON profiles(avatar_status) WHERE avatar_status != 'ok';