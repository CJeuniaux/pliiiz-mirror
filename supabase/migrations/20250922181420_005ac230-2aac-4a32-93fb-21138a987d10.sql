-- Fix get_directory_profiles function to exclude bio and exclude existing contacts
CREATE OR REPLACE FUNCTION public.get_directory_profiles()
 RETURNS TABLE(user_id uuid, first_name text, last_name text, regift boolean, avatar_url text, updated_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    COALESCE(p.regift_enabled, false) AS regift,
    p.avatar_url,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id <> auth.uid()
    AND p.user_id NOT IN (
      -- Exclude users who are already contacts
      SELECT contact_user_id FROM contacts WHERE owner_id = auth.uid()
    )
    AND p.user_id NOT IN (
      -- Exclude users who have pending or accepted requests
      SELECT from_user_id FROM requests WHERE to_user_id = auth.uid()
      UNION
      SELECT to_user_id FROM requests WHERE from_user_id = auth.uid()
    );
$function$