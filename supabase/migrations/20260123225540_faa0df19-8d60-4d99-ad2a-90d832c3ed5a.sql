-- Remove public read access
DROP POLICY "Allow reading beta subscribers" ON public.beta_subscribers;

-- No SELECT policy = only service_role can read (you can view via Cloud SQL editor)