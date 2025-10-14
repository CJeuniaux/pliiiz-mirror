-- Migration: Fix preferences triggers and sync to profiles.global_preferences
-- Date: 2025-10-14
-- Purpose: Remove incorrect triggers referencing global_preferences on preferences table
--          and create proper sync mechanism to profiles table

-- 1. Drop any existing triggers on preferences that might cause issues
DROP TRIGGER IF EXISTS preferences_sync_profile ON preferences;
DROP TRIGGER IF EXISTS sync_preferences_to_profile ON preferences;
DROP TRIGGER IF EXISTS trg_sync_prefs_to_profile ON preferences;

-- 2. Drop the faulty function if it exists
DROP FUNCTION IF EXISTS public.preferences_sync_profile_fn() CASCADE;
DROP FUNCTION IF EXISTS public.sync_prefs_to_profile() CASCADE;

-- 3. Create new sync function that updates profiles.global_preferences from preferences
CREATE OR REPLACE FUNCTION public.sync_prefs_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  column_exists boolean;
BEGIN
  -- Verify that global_preferences column exists on profiles table
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'global_preferences'
  ) INTO column_exists;
  
  -- Only proceed if the column exists
  IF column_exists THEN
    -- Build global_preferences JSONB from preferences table fields
    UPDATE profiles
    SET 
      global_preferences = jsonb_build_object(
        'likes', COALESCE(NEW.likes, '{}'),
        'avoid', COALESCE(NEW.dislikes, '{}'),
        'allergies', COALESCE(NEW.allergies, '{}'),
        'giftIdeas', COALESCE(NEW.gift_ideas, '{}'),
        'sizes', COALESCE(NEW.sizes, '{}')
      ),
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Create trigger on preferences to sync to profiles
CREATE TRIGGER trg_sync_prefs_to_profile
  AFTER INSERT OR UPDATE ON public.preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_prefs_to_profile();

-- Note: This migration does NOT modify RLS policies or other tables