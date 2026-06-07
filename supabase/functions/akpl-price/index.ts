import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Content-Type": "application/json",
};

// NEPSE endpoints to try (server-side — no CORS restrictions)
const ENDPOINTS = [
  "https://www.nepalstock.com/api/nots/securityDailyTradeStat/2757",
  "https://www.nepalstock.com/api/nots/nepse-data/companyList",
  "https://nepsetty.kokomo.workers.dev/api/stock?symbol=AKPL",
];

async function tryEndpoint(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const json = await res.json();

    // companyList returns an array — find AKPL
    if (Array.isArray(json)) {
      const akpl = json.find((s: Record<string, unknown>) =>
        String(s.symbol ?? s.Symbol ?? s.securitySymbol ?? "").toUpperCase() === "AKPL"
      );
      return akpl ?? null;
    }

    // Single object — check it has price data
    const price = json.closingPrice ?? json.ltp ?? json.lastTradedPrice ?? json.price;
    if (price) return json as Record<string, unknown>;

    return null;
  } catch {
    return null;
  }
}

function normalise(raw: Record<string, unknown>) {
  const price    = Number(raw.closingPrice      ?? raw.ltp ?? raw.lastTradedPrice ?? raw.close ?? 0);
  const prev     = Number(raw.previousClosingPrice ?? raw.prevClose ?? raw.previousClose ?? 0);
  const volume   = Number(raw.totalTradedQuantity  ?? raw.volume ?? raw.qty ?? 0);
  const change   = prev ? +(price - prev).toFixed(2) : Number(raw.change ?? raw.pointChange ?? 0);
  const changePct= prev ? +((change / prev) * 100).toFixed(2) : Number(raw.percentageChange ?? raw.changePercent ?? 0);
  const high     = Number(raw.highPrice  ?? raw.high  ?? 0);
  const low      = Number(raw.lowPrice   ?? raw.low   ?? 0);
  const open     = Number(raw.openingPrice ?? raw.open ?? 0);

  return { price, prev, change, changePct, volume, high, low, open };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Try each endpoint until one works
  for (const url of ENDPOINTS) {
    const raw = await tryEndpoint(url);
    if (!raw) continue;

    const { price, prev, change, changePct, volume, high, low, open } = normalise(raw);
    if (price === 0) continue;

    // Optionally persist to akpl_price table (if env vars set)
    try {
      const supabaseUrl  = Deno.env.get("SUPABASE_URL");
      const supabaseKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const asOf = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kathmandu",
          dateStyle: "medium",
          timeStyle: "short",
        });
        await supabase.from("akpl_price").upsert({
          id: 1, price, prev_close: prev, change, change_pct: changePct,
          volume, as_of: asOf, updated_at: new Date().toISOString(),
        });
      }
    } catch { /* non-critical — continue */ }

    const body = JSON.stringify({
      symbol:        "AKPL",
      company_name:  "Arun Kabeli Power Ltd.",
      price,
      prev_close:    prev,
      change,
      change_pct:    changePct,
      volume,
      high,
      low,
      open,
      as_of: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kathmandu",
        dateStyle: "medium",
        timeStyle: "short",
      }),
      source: url,
    });

    return new Response(body, {
      headers: { ...CORS, "Cache-Control": "public, max-age=60" },
    });
  }

  return new Response(
    JSON.stringify({ error: "All NEPSE sources unavailable", price: 0 }),
    { status: 503, headers: CORS }
  );
});
