-- Create design_feedback table for collecting user feedback on the new design
CREATE TABLE public.design_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('LOVE', 'MIXED', 'DISLIKE')),
  comment TEXT CHECK (length(comment) <= 300),
  client_meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can insert feedback" 
ON public.design_feedback 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own feedback" 
ON public.design_feedback 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR auth.role() = 'service_role'
);

CREATE POLICY "Users can update their own feedback within 24h" 
ON public.design_feedback 
FOR UPDATE 
USING (
  auth.uid() = user_id
  AND created_at > now() - interval '24 hours'
);

-- Admin access policy
CREATE POLICY "Admins can view all feedback" 
ON public.design_feedback 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (global_preferences->>'role' = 'admin' OR global_preferences->>'is_admin' = 'true')
  )
);

-- Update trigger
CREATE TRIGGER update_design_feedback_updated_at
  BEFORE UPDATE ON public.design_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for better performance
CREATE INDEX idx_design_feedback_created_at ON public.design_feedback(created_at DESC);
CREATE INDEX idx_design_feedback_choice ON public.design_feedback(choice);
CREATE INDEX idx_design_feedback_user_id ON public.design_feedback(user_id);
CREATE INDEX idx_design_feedback_session_id ON public.design_feedback(session_id);

-- Create unique constraint to prevent duplicate feedback per user/session
CREATE UNIQUE INDEX idx_design_feedback_unique_user_session 
ON public.design_feedback((COALESCE(user_id::text, session_id)));