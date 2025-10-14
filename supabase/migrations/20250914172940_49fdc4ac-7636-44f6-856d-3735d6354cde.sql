-- Fix remaining security issues

-- Check what functions still need search_path fix
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile with enhanced data
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    email, 
    email_verified,
    regift_enabled,
    language
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    false,
    COALESCE(NEW.raw_user_meta_data ->> 'language', 'fr')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, profiles.email_verified),
    first_name = COALESCE(NEW.raw_user_meta_data ->> 'first_name', profiles.first_name),
    last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', profiles.last_name),
    email = COALESCE(NEW.email, profiles.email),
    updated_at = now();
  
  -- Enhanced preferences with onboarding data support
  INSERT INTO public.preferences (
    user_id, 
    likes, 
    dislikes, 
    allergies, 
    sizes, 
    current_wants
  )
  VALUES (
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data ->> 'likes')::text[], '{}'), 
    COALESCE((NEW.raw_user_meta_data ->> 'dislikes')::text[], '{}'), 
    COALESCE((NEW.raw_user_meta_data ->> 'allergies')::text[], '{}'), 
    COALESCE((NEW.raw_user_meta_data ->> 'sizes')::jsonb, '{}'::jsonb), 
    COALESCE((NEW.raw_user_meta_data ->> 'current_wants')::text[], '{}')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    likes = COALESCE((NEW.raw_user_meta_data ->> 'likes')::text[], preferences.likes),
    dislikes = COALESCE((NEW.raw_user_meta_data ->> 'dislikes')::text[], preferences.dislikes),
    allergies = COALESCE((NEW.raw_user_meta_data ->> 'allergies')::text[], preferences.allergies),
    current_wants = COALESCE((NEW.raw_user_meta_data ->> 'current_wants')::text[], preferences.current_wants),
    updated_at = now();
  
  -- Ensure share link exists with friendly slug
  INSERT INTO public.share_links (user_id, slug, is_active)
  VALUES (
    NEW.id, 
    COALESCE(
      lower(regexp_replace(
        concat(
          COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'user'),
          '-',
          substr(encode(gen_random_bytes(4), 'hex'), 1, 8)
        ), 
        '[^a-z0-9-]', '-', 'gi'
      )),
      encode(gen_random_bytes(8), 'hex')
    ), 
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
  
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$function$;