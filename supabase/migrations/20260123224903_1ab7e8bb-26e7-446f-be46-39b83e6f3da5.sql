-- Create beta subscribers table for notification form
CREATE TABLE public.beta_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  discord TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can subscribe to beta notifications"
  ON public.beta_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Index for faster email lookups
CREATE INDEX idx_beta_subscribers_email ON public.beta_subscribers(email);