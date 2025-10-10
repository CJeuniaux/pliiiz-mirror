-- RPC to fetch active slug for any user (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_active_slug(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT slug
  FROM public.share_links
  WHERE user_id = user_uuid AND is_active = true
  LIMIT 1;
$$;