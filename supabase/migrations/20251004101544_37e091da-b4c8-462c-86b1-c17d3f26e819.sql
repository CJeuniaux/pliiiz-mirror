-- Resolve user_id from public slug with SECURITY DEFINER (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_user_id_by_slug(p_slug text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.share_links
  WHERE slug = p_slug AND is_active = true
  LIMIT 1;
$$;