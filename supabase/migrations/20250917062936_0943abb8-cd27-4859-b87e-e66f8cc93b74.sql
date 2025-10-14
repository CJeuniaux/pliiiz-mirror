-- Fix misattached triggers causing OLD.global_preferences error on preferences updates
-- 1) Ensure the profile preferences trigger is attached to profiles table only
-- 2) Ensure preferences table has its own correct trigger

-- Drop any incorrectly attached trigger on preferences referencing the profile function
DROP TRIGGER IF EXISTS trg_notify_contacts_on_profile_prefs_update ON public.preferences;

-- Create/replace trigger on profiles for profile-level preferences (global_preferences / occasion_prefs)
DROP TRIGGER IF EXISTS trg_notify_contacts_on_profile_prefs_update ON public.profiles;
CREATE TRIGGER trg_notify_contacts_on_profile_prefs_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (
  (OLD.global_preferences IS DISTINCT FROM NEW.global_preferences) OR 
  (OLD.occasion_prefs IS DISTINCT FROM NEW.occasion_prefs)
)
EXECUTE FUNCTION public.notify_contacts_on_profile_preferences_update();

-- Create/replace trigger on preferences for classic preferences (likes, dislikes, gift_ideas, current_wants)
DROP TRIGGER IF EXISTS trg_notify_contacts_on_preferences_update ON public.preferences;
CREATE TRIGGER trg_notify_contacts_on_preferences_update
AFTER UPDATE ON public.preferences
FOR EACH ROW
WHEN (
  (OLD.current_wants IS DISTINCT FROM NEW.current_wants) OR
  (OLD.likes IS DISTINCT FROM NEW.likes) OR
  (OLD.dislikes IS DISTINCT FROM NEW.dislikes) OR
  (OLD.gift_ideas IS DISTINCT FROM NEW.gift_ideas)
)
EXECUTE FUNCTION public.notify_contacts_on_preferences_update();
