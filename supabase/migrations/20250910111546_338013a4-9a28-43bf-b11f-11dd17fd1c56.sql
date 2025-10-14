-- Directory listing function to bypass RLS safely
CREATE OR REPLACE FUNCTION public.get_directory_profiles()
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  regift boolean,
  bio text,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    COALESCE(p.regift_enabled, false) AS regift,
    p.bio,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id <> auth.uid();
$$;

-- Ensure authenticated users can execute the function
GRANT EXECUTE ON FUNCTION public.get_directory_profiles() TO authenticated;