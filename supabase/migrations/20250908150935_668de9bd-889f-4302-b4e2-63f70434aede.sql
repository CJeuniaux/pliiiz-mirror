-- Secure public profile access without exposing email addresses
-- 1) Create a public-safe view that NEVER includes email
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  p.id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.language,
  p.created_at,
  p.updated_at
FROM public.profiles p
JOIN public.share_links sl
  ON sl.user_id = p.user_id
 AND sl.is_active = true;

-- 2) Restrict default privileges and grant explicit read access to web clients
REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC;
GRANT SELECT ON TABLE public.public_profiles TO anon, authenticated;

-- 3) Add documentation
COMMENT ON VIEW public.public_profiles IS 'Public-safe profile data (no email), only for users with active share links.';

-- Note: We keep strict RLS on public.profiles so emails remain protected.
-- Frontend should read from public.public_profiles for shared links.
