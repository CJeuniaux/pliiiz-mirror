-- Create function to get contacts with image previews
CREATE OR REPLACE FUNCTION public.get_contacts_with_previews()
RETURNS TABLE(
  contact_id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  city text,
  regift_enabled boolean,
  birthday date,
  preview_urls text[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    c.id as contact_id,
    c.contact_user_id as user_id,
    COALESCE((p.first_name || ' ' || COALESCE(p.last_name, '')), 'Contact') as display_name,
    p.avatar_url,
    p.city,
    COALESCE(p.regift_enabled, false) as regift_enabled,
    p.birthday,
    COALESCE(
      (SELECT array_agg(url ORDER BY created_at DESC)
       FROM (
         SELECT url, created_at 
         FROM user_uploads uu 
         WHERE uu.user_id = c.contact_user_id 
         ORDER BY created_at DESC 
         LIMIT 3
       ) recent_uploads),
      '{}'::text[]
    ) as preview_urls
  FROM contacts c
  LEFT JOIN profiles p ON p.user_id = c.contact_user_id
  WHERE c.owner_id = auth.uid()
  ORDER BY LOWER(COALESCE((p.first_name || ' ' || COALESCE(p.last_name, '')), 'Contact')) ASC;
$function$;