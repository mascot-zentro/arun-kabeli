-- Add gallery_urls JSONB to projects for admin-managed gallery images
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
