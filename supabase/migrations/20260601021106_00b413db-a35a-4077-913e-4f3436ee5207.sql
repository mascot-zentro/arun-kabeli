
CREATE TABLE public.subsidiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  images text[] NOT NULL DEFAULT '{}',
  website text,
  sort_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.subsidiaries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subsidiaries TO authenticated;
GRANT ALL ON public.subsidiaries TO service_role;

ALTER TABLE public.subsidiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read visible subsidiaries" ON public.subsidiaries
  FOR SELECT TO public USING (is_visible = true);

CREATE POLICY "admin all subsidiaries" ON public.subsidiaries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER subsidiaries_updated_at
  BEFORE UPDATE ON public.subsidiaries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('subsidiary-photos', 'subsidiary-photos', true);

CREATE POLICY "public read subsidiary photos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'subsidiary-photos');

CREATE POLICY "admin upload subsidiary photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'subsidiary-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin update subsidiary photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'subsidiary-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin delete subsidiary photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'subsidiary-photos' AND has_role(auth.uid(), 'admin'::app_role));
