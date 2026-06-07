CREATE TABLE IF NOT EXISTS public.akpl_price (
  id INT PRIMARY KEY,
  price NUMERIC,
  prev_close NUMERIC,
  change NUMERIC,
  change_pct NUMERIC,
  volume BIGINT,
  as_of TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.akpl_price TO anon, authenticated;
GRANT ALL ON public.akpl_price TO service_role;
ALTER TABLE public.akpl_price ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read akpl price" ON public.akpl_price FOR SELECT TO public USING (true);

-- Trigger an initial fetch so row id=1 exists
SELECT public.refresh_akpl_price();