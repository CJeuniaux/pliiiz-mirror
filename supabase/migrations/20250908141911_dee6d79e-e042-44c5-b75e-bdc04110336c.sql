-- Drop the existing public access policy that exposes email addresses
DROP POLICY IF EXISTS "Allow public to view active shared profiles" ON public.profiles;

-- Create a new policy that allows public access to profiles via share links but excludes sensitive data
-- We'll use a security definer function to safely control what data is exposed
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  language text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
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
$$;

-- Create a new RLS policy that only allows access to non-sensitive profile data
-- This policy will work in conjunction with application-level filtering
CREATE POLICY "Allow limited public access to shared profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow access if there's an active share link
  -- The application layer should filter out sensitive fields like email
  EXISTS (
    SELECT 1 FROM share_links 
    WHERE share_links.user_id = profiles.user_id 
    AND share_links.is_active = true
  )
  -- But we'll add an additional check to prevent direct email access
  AND (
    -- Allow full access to authenticated users viewing their own profile
    auth.uid() = profiles.user_id
    -- For public access via share links, this policy will be restrictive
    -- and the application should use the get_public_profile_data function instead
  )
);

-- Create a separate policy specifically for public shared profile access
-- This will be used by a dedicated endpoint/function
CREATE POLICY "Public shared profile access" 
ON public.profiles 
FOR SELECT 
USING (
  -- This policy is specifically for the public access function
  -- It should only be used by the get_public_profile_data function
  current_setting('role') = 'service_role'
);