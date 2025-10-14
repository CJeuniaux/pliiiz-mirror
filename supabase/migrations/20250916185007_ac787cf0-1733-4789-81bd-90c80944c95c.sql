-- Update directory listing function to include avatar_url
CREATE OR REPLACE FUNCTION public.get_directory_profiles()
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  regift boolean,
  bio text,
  avatar_url text,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    COALESCE(p.regift_enabled, false) AS regift,
    p.bio,
    p.avatar_url,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id <> auth.uid();
$$;