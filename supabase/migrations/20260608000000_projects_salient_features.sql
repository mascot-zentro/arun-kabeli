-- Add salient_features JSONB to projects
-- Each feature: { icon: string, label: string, value: string }
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS salient_features JSONB NOT NULL DEFAULT '[]'::jsonb;
