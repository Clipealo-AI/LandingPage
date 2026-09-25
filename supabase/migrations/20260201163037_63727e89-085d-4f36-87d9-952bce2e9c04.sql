-- Add restrictive SELECT policy that blocks all public reads
-- Data can only be accessed via service role (Supabase dashboard/backend)
CREATE POLICY "No public read access to subscribers"
ON public.beta_subscribers
FOR SELECT
USING (false);