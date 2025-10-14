-- Add foreign key constraints to requests table for better joins
-- This will help with fetching user profiles along with requests

-- Add foreign key to from_user_id referencing auth.users
ALTER TABLE public.requests 
ADD CONSTRAINT requests_from_user_id_fkey 
FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key to to_user_id referencing auth.users  
ALTER TABLE public.requests 
ADD CONSTRAINT requests_to_user_id_fkey 
FOREIGN KEY (to_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;