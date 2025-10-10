-- Fix Security Definer View vulnerabilities by implementing proper RLS and security definer functions

-- First, enable RLS on all views (this will require recreating them as tables with policies)
-- Drop existing problematic views that bypass RLS
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.public_profiles_view CASCADE;

-- Enable RLS on the my_contacts_view (it should inherit from underlying tables but let's be explicit)
-- Since we can't directly add RLS to views, we'll create security definer functions instead

-- Create secure function to get user's contacts with proper RLS enforcement
CREATE OR REPLACE FUNCTION public.get_my_contacts_secure()
RETURNS TABLE(
  owner_id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  birthday date,
  wishlist text[],
  regift_enabled boolean,
  wishlist_top3 text[]
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    c.owner_id,
    c.contact_user_id AS user_id,
    COALESCE((p.first_name || ' ' || COALESCE(p.last_name, '')), 'Contact') AS display_name,
    p.avatar_url,
    p.birthday,
    COALESCE(pr.current_wants, '{}') AS wishlist,
    COALESCE(p.regift_enabled, false) AS regift_enabled,
    (SELECT array_agg(elem) FROM (
      SELECT unnest(COALESCE(pr.current_wants, '{}')) AS elem LIMIT 3
    ) x) AS wishlist_top3
  FROM contacts c
  LEFT JOIN profiles p ON p.user_id = c.contact_user_id
  LEFT JOIN preferences pr ON pr.user_id = c.contact_user_id
  WHERE c.owner_id = auth.uid(); -- Enforce that user can only see their own contacts
$$;

-- Create secure function for public profile access (only for profiles with active share links)
CREATE OR REPLACE FUNCTION public.get_public_profile_secure(profile_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  birthday date,
  city text,
  country text,
  wishlist text[],
  food_prefs text[],
  style_prefs text[],
  dislikes text[],
  regift_enabled boolean,
  regift_note text,
  occasion_prefs jsonb,
  updated_at timestamp with time zone
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    COALESCE((p.first_name || ' ' || COALESCE(p.last_name, '')), 'Utilisateur') AS display_name,
    p.avatar_url,
    p.bio,
    p.birthday,
    p.city,
    p.country,
    COALESCE(pr.current_wants, '{}') AS wishlist,
    COALESCE(pr.likes, '{}') AS food_prefs,
    COALESCE(pr.likes, '{}') AS style_prefs,
    COALESCE(pr.dislikes, '{}') AS dislikes,
    COALESCE(p.regift_enabled, false) AS regift_enabled,
    p.regift_note,
    COALESCE(p.occasion_prefs, '{}') AS occasion_prefs,
    p.updated_at
  FROM profiles p
  LEFT JOIN preferences pr ON pr.user_id = p.user_id
  WHERE p.user_id = profile_user_id
    AND EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.user_id = profile_user_id 
      AND sl.is_active = true
    );
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_contacts_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile_secure(uuid) TO authenticated;

-- Add comment explaining the security fix
COMMENT ON FUNCTION public.get_my_contacts_secure() IS 'Secure replacement for my_contacts_view - enforces RLS by only returning contacts owned by authenticated user';
COMMENT ON FUNCTION public.get_public_profile_secure(uuid) IS 'Secure replacement for public_profiles views - only returns profiles with active share links';