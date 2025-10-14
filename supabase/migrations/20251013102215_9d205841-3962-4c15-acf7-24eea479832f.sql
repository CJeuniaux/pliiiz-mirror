-- Drop and recreate get_directory_profiles with correct signature
DROP FUNCTION IF EXISTS public.get_directory_profiles();

CREATE OR REPLACE FUNCTION public.get_directory_profiles()
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  regift boolean,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COALESCE(p.regift_enabled, false) AS regift,
    p.updated_at
  FROM profiles p
  WHERE p.user_id <> auth.uid()
  ORDER BY COALESCE(p.first_name,'') ASC, COALESCE(p.last_name,'') ASC
  LIMIT 200;
$$;