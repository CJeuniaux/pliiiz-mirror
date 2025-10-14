-- 1) RESET DB PROPRE - Clean reset keeping only the first user
DO $$
DECLARE 
  keep_user_id UUID := '726eb13f-86e2-463b-a57e-f155e7e8689b'; -- First user (charlotte.j@kikk.be)
BEGIN
  -- Clear all dependent tables first
  TRUNCATE TABLE event_invites, requests, notifications, contacts, regift_listings RESTART IDENTITY CASCADE;
  TRUNCATE TABLE events RESTART IDENTITY CASCADE;
  
  -- Remove share_links for other users (keep share_links for keep_user_id)
  DELETE FROM share_links WHERE user_id <> keep_user_id;
  
  -- Clear partners (remove sample data)
  TRUNCATE TABLE partners RESTART IDENTITY CASCADE;
  
  -- Remove all profiles except the one to keep
  DELETE FROM profiles WHERE user_id <> keep_user_id;
  
  -- Remove all users except the one to keep from auth.users (THIS IS CRITICAL)
  -- Note: This affects the auth schema, so we need to be careful
  DELETE FROM auth.users WHERE id <> keep_user_id;
  
  -- Reset the profile of the kept user to clean state
  UPDATE profiles 
  SET bio = NULL, 
      birthday = NULL,
      regift_enabled = false, 
      regift_note = NULL, 
      updated_at = now()
  WHERE user_id = keep_user_id;
  
  -- Reset preferences for the kept user
  UPDATE preferences 
  SET likes = '{}', 
      dislikes = '{}', 
      allergies = '{}', 
      sizes = '{}'::jsonb, 
      current_wants = '{}',
      updated_at = now()
  WHERE user_id = keep_user_id;
  
  -- Ensure share_link exists for kept user
  INSERT INTO share_links (user_id, slug, is_active)
  VALUES (keep_user_id, encode(gen_random_bytes(8), 'hex'), true)
  ON CONFLICT (user_id) DO UPDATE SET
    slug = encode(gen_random_bytes(8), 'hex'),
    is_active = true,
    updated_at = now();

END $$;