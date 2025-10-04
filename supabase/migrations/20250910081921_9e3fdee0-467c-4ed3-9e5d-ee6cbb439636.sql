-- Enable RLS on app_meta table
ALTER TABLE public.app_meta ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading app_meta (for seed checking)
CREATE POLICY "App meta is readable by authenticated users" 
ON public.app_meta 
FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Create policy to allow service role to manage app_meta
CREATE POLICY "Service role can manage app_meta" 
ON public.app_meta 
FOR ALL 
USING (auth.role() = 'service_role');