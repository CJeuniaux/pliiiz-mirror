-- Add new giftIdeas column to preferences table
ALTER TABLE public.preferences 
ADD COLUMN gift_ideas text[] DEFAULT '{}';

-- Copy existing current_wants data to gift_ideas
UPDATE public.preferences 
SET gift_ideas = current_wants 
WHERE current_wants IS NOT NULL AND current_wants != '{}';

-- Update rows where current_wants is null or empty
UPDATE public.preferences 
SET gift_ideas = '{}' 
WHERE gift_ideas IS NULL;