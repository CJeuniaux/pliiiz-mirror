-- Add global_preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS global_preferences jsonb DEFAULT '{
  "likes": [],
  "avoid": [],
  "allergies": [],
  "sizes": {},
  "giftIdeas": []
}'::jsonb;

-- Update the existing occasion_prefs to ensure it has the right structure
UPDATE public.profiles 
SET occasion_prefs = COALESCE(occasion_prefs, '{}'::jsonb)
WHERE occasion_prefs IS NULL;