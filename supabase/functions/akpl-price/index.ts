// Supabase Edge Function — CORS proxy for AKPL live price
// Deployed at: /functions/v1/akpl-price
// Tries NEPSE official API, falls back to nepsetty

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

const ENDPOINTS = [
  "https://nepsetty.kokomo.workers.dev/api/stock?symbol=AKPL",
  "https://www.nepalstock.com/api/nots/securityDailyTradeStat/2757",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) continue;
      const json = await res.json();
      const price     = Number(json.ltp ?? json.closingPrice ?? json.lastTradedPrice ?? 0);
      const prevClose = Number(json.previousClosingPrice ?? json.prevClose ?? 0);
      const change    = price && prevClose ? +(price - prevClose).toFixed(2) : 0;
      const changePct = prevClose ? +((change / prevClose) * 100).toFixed(2) : 0;
      const data = {
        symbol:        "AKPL",
        company_name:  "Arun Kabeli Power Ltd.",
        price,
        prevClose,
        change,
        changePercent: changePct,
        volume:        Number(json.totalTradedQuantity ?? json.volume ?? 0),
        updatedAt:     json.last_updated ?? json.lastUpdatedDateTime ?? new Date().toISOString(),
        source:        url,
      };
      if (price > 0) {
        return new Response(JSON.stringify(data), { headers: { ...CORS, "Cache-Control": "public, max-age=30" } });
      }
    } catch { /* try next */ }
  }

  return new Response(JSON.stringify({ error: "All sources failed" }), { status: 503, headers: CORS });
});
