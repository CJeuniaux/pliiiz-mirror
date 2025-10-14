-- Fix email harvesting vulnerability by removing public access to email addresses
-- Drop the problematic RLS policy that allows public access to full profiles
DROP POLICY IF EXISTS "Allow limited public access to shared profiles" ON public.profiles;

-- Create a new RLS policy that only allows public access through the security definer function
-- This ensures email addresses are never exposed to public users
CREATE POLICY "Public access only through security definer function" 
ON public.profiles 
FOR SELECT 
USING (false); -- This policy explicitly denies direct public access

-- Update the get_public_profile_data function to be more explicit about what data is returned
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, first_name text, last_name text, language text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.language,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.user_id = profile_user_id
    AND EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.user_id = profile_user_id 
      AND sl.is_active = true
    );
$function$;

-- Create a view for public profile access that explicitly excludes sensitive data
CREATE OR REPLACE VIEW public.safe_public_profiles AS
SELECT 
  p.id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.language,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE EXISTS (
  SELECT 1 FROM share_links sl 
  WHERE sl.user_id = p.user_id 
  AND sl.is_active = true
);

-- Grant access to the safe view
GRANT SELECT ON public.safe_public_profiles TO anon, authenticated;