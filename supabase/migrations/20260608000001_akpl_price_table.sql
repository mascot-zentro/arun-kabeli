-- AKPL live price table — populated by pg_cron scheduled function
CREATE TABLE IF NOT EXISTS public.akpl_price (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  price       NUMERIC DEFAULT 0,
  prev_close  NUMERIC DEFAULT 0,
  change      NUMERIC DEFAULT 0,
  change_pct  NUMERIC DEFAULT 0,
  volume      BIGINT  DEFAULT 0,
  as_of       TEXT    DEFAULT 'Not yet fetched',
  updated_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.akpl_price ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read akpl_price"
  ON public.akpl_price FOR SELECT USING (true);

CREATE POLICY "admin write akpl_price"
  ON public.akpl_price FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed the single row
INSERT INTO public.akpl_price (id) VALUES (1) ON CONFLICT DO NOTHING;
