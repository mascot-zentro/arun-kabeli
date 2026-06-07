
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.refresh_akpl_price()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_body TEXT;
  price_val     NUMERIC;
  prev_val      NUMERIC;
  vol_val       BIGINT;
  req_id        BIGINT;
BEGIN
  SELECT net.http_get(
    'https://corsproxy.io/?https%3A%2F%2Fwww.nepalstock.com%2Fapi%2Fnots%2FsecurityDailyTradeStat%2F2757'
  ) INTO req_id;

  -- pg_net is async; wait briefly and read the response
  PERFORM pg_sleep(2);

  SELECT content INTO response_body
  FROM net._http_response
  WHERE id = req_id;

  IF response_body IS NULL THEN
    RETURN;
  END IF;

  price_val := (response_body::json->>'closingPrice')::NUMERIC;
  prev_val  := (response_body::json->>'previousClosingPrice')::NUMERIC;
  vol_val   := (response_body::json->>'totalTradedQuantity')::BIGINT;

  IF price_val IS NULL OR price_val = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.akpl_price (id, price, prev_close, change, change_pct, volume, as_of, updated_at)
  VALUES (
    1, price_val, prev_val,
    ROUND(price_val - prev_val, 2),
    CASE WHEN prev_val > 0 THEN ROUND(((price_val - prev_val) / prev_val) * 100, 2) ELSE 0 END,
    vol_val,
    to_char(now() AT TIME ZONE 'Asia/Kathmandu', 'Mon DD, YYYY · HH12:MI AM'),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    price      = EXCLUDED.price,
    prev_close = EXCLUDED.prev_close,
    change     = EXCLUDED.change,
    change_pct = EXCLUDED.change_pct,
    volume     = EXCLUDED.volume,
    as_of      = EXCLUDED.as_of,
    updated_at = EXCLUDED.updated_at;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- Unschedule if already exists, then reschedule
DO $$
BEGIN
  PERFORM cron.unschedule('fetch-akpl-price');
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

SELECT cron.schedule(
  'fetch-akpl-price',
  '*/5 5-9 * * 0-4',
  $$SELECT public.refresh_akpl_price()$$
);
