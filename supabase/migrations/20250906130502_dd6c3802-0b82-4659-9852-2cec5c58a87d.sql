-- Update the handle_new_user function to ensure proper profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer set search_path = public
AS $$
BEGIN
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
    last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', profiles.last_name);
  
  INSERT INTO public.preferences (user_id, likes, dislikes, allergies, sizes, current_wants)
  VALUES (NEW.id, '{}', '{}', '{}', '{}', '{}')
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.share_links (user_id, slug, is_active)
  VALUES (NEW.id, encode(gen_random_bytes(8), 'hex'), true)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();