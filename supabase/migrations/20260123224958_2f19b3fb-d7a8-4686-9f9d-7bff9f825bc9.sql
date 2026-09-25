-- Allow reading subscribers (for admin/owner to view list)
CREATE POLICY "Allow reading beta subscribers"
  ON public.beta_subscribers
  FOR SELECT
  USING (true);