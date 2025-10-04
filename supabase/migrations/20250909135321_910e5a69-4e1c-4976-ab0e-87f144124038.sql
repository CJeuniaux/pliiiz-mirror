-- Fix profile duplication and data integrity issues

-- First, let's clean up any existing duplicate profiles
-- Find and merge duplicate profiles for the same user_id
DO $$
DECLARE
    duplicate_record RECORD;
    main_profile_id UUID;
BEGIN
    -- For each user_id that has multiple profiles, keep the most recent one
    FOR duplicate_record IN
        SELECT user_id, COUNT(*) as profile_count
        FROM profiles 
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        HAVING COUNT(*) > 1
    LOOP
        -- Get the most recent profile for this user
        SELECT id INTO main_profile_id
        FROM profiles 
        WHERE user_id = duplicate_record.user_id
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- Delete older profiles for this user
        DELETE FROM profiles 
        WHERE user_id = duplicate_record.user_id 
        AND id != main_profile_id;
        
        RAISE NOTICE 'Cleaned up duplicates for user_id: %, kept profile: %', duplicate_record.user_id, main_profile_id;
    END LOOP;
END $$;

-- Ensure user_id is NOT NULL in profiles table (should never be null)
UPDATE profiles SET user_id = id WHERE user_id IS NULL;

-- Add constraint to prevent null user_id
ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;

-- Ensure the trigger function handles idempotency better
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use INSERT ... ON CONFLICT to ensure idempotency
  INSERT INTO public.profiles (user_id, first_name, last_name, email, email_verified)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    first_name = COALESCE(NEW.raw_user_meta_data ->> 'first_name', profiles.first_name),
    last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', profiles.last_name),
    email = COALESCE(NEW.email, profiles.email),
    updated_at = now();
  
  -- Ensure preferences exist
  INSERT INTO public.preferences (user_id, likes, dislikes, allergies, sizes, current_wants)
  VALUES (NEW.id, '{}', '{}', '{}', '{}', '{}')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Ensure share link exists
  INSERT INTO public.share_links (user_id, slug, is_active)
  VALUES (NEW.id, encode(gen_random_bytes(8), 'hex'), true)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add unique constraint on user_id if it doesn't exist
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);