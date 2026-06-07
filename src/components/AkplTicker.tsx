import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

type StockData = {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume: number;
  updatedAt: string;
};

// Primary: Official NEPSE public API (security ID 2757 = AKPL)
const NEPSE_API   = "https://www.nepalstock.com/api/nots/securityDailyTradeStat/2757";
// Fallback: merolagani public endpoint
const MERO_API    = "https://merolagani.com/handlers/webrequesthandler.ashx?type=get_live_price&symbol=AKPL";
const REFRESH_MS  = 60_000;

export function AkplTicker({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  async function fetchData() {
    setError(false);
    try {
      // Try official NEPSE API first
      const res = await fetch(NEPSE_API, { headers: { "Accept": "application/json" } });
      if (!res.ok) throw new Error("NEPSE API failed");
      const json = await res.json();
      // NEPSE API shape: { securityId, symbol, closingPrice, openingPrice, highPrice,
      //   lowPrice, totalTradedQuantity, totalTradedValue, previousClosingPrice, lastUpdatedDateTime }
      const price      = Number(json.closingPrice ?? json.lastTradedPrice ?? json.ltp ?? 0);
      const prevClose  = Number(json.previousClosingPrice ?? json.prevClose ?? 0);
      const change     = price && prevClose ? price - prevClose : 0;
      const changePct  = prevClose ? (change / prevClose) * 100 : 0;
      setData({
        symbol:        json.symbol ?? "AKPL",
        price,
        prevClose,
        change,
        changePercent: changePct,
        volume:        Number(json.totalTradedQuantity ?? json.volume ?? 0),
        updatedAt:     json.lastUpdatedDateTime ?? json.last_updated ?? "",
      });
      setLastFetched(new Date());
    } catch {
      // Fallback: try merolagani
      try {
        const res2 = await fetch(MERO_API);
        if (!res2.ok) throw new Error();
        const json2 = await res2.json();
        const price     = Number(json2.LastTradedPrice ?? json2.ltp ?? json2.price ?? 0);
        const prevClose = Number(json2.PreviousClose ?? json2.prevClose ?? 0);
        const change    = price && prevClose ? price - prevClose : 0;
        setData({
          symbol:        "AKPL",
          price,
          prevClose,
          change,
          changePercent: prevClose ? (change / prevClose) * 100 : 0,
          volume:        Number(json2.TotalShareTraded ?? json2.volume ?? 0),
          updatedAt:     json2.AsOf ?? json2.lastUpdated ?? "",
        });
        setLastFetched(new Date());
      } catch {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const up   = data && data.change > 0;
  const down = data && data.change < 0;
  const flat = data && data.change === 0;

  if (compact) {
    // Slim inline ticker for the navbar / hero bar
    return (
      <a
        href="https://www.nepalstock.com/company/detail/2757"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs backdrop-blur-sm transition hover:bg-white/15"
        title="AKPL live price — Nepal Stock Exchange"
      >
        <span className="font-mono font-semibold text-white">AKPL</span>
        {loading && <span className="text-white/50">—</span>}
        {error && <span className="text-red-400">error</span>}
        {data && (
          <>
            <span className="font-mono font-bold text-white">Rs. {data.price.toFixed(2)}</span>
            <span className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold ${up ? "text-green-400" : down ? "text-red-400" : "text-white/60"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {data.changePercent !== 0 ? `${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%` : "LTP"}
            </span>
          </>
        )}
      </a>
    );
  }

  // Full card variant
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-secondary/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">NEPSE · Live</span>
        </div>
        <button
          onClick={fetchData}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="px-5 py-5">
        {loading && !data && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading market data…
          </div>
        )}

        {error && !data && (
          <div className="text-sm text-muted-foreground">
            Market data unavailable — <a href="https://www.nepalstock.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">check NEPSE directly</a>
          </div>
        )}

        {data && (
          <>
            {/* Company + price */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">Arun Kabeli Power Ltd.</p>
                <p className="mt-0.5 font-mono text-4xl font-bold tracking-tight text-foreground">
                  Rs. {data.price.toFixed(2)}
                </p>
              </div>
              <div className={`flex flex-col items-end rounded-xl px-3 py-2 ${up ? "bg-green-500/10" : down ? "bg-red-500/10" : "bg-secondary"}`}>
                <div className={`flex items-center gap-1 text-lg font-bold ${up ? "text-green-600 dark:text-green-400" : down ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                  {up ? <TrendingUp className="h-5 w-5" /> : down ? <TrendingDown className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                  {data.change !== 0 ? `${data.change >= 0 ? "+" : ""}${data.change.toFixed(2)}` : "—"}
                </div>
                <div className={`text-sm font-semibold ${up ? "text-green-600 dark:text-green-400" : down ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                  {data.changePercent !== 0 ? `${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%` : "LTP"}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Previous Close</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{data.prevClose > 0 ? `Rs. ${data.prevClose.toFixed(2)}` : "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Volume</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{data.volume > 0 ? data.volume.toLocaleString() : "—"}</p>
              </div>
            </div>

            {/* Symbol + exchange */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 font-mono text-xs font-bold text-primary">AKPL</span>
                <span className="text-xs text-muted-foreground">Hydro Power · NEPSE</span>
              </div>
              <a
                href="https://www.nepalstock.com/company/detail/2757"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground underline hover:text-primary"
              >
                View on NEPSE ↗
              </a>
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground/60">
              {data.updatedAt
                ? `Market data: ${new Date(data.updatedAt).toLocaleString("en-NP", { dateStyle: "medium", timeStyle: "short" })}`
                : lastFetched ? `Fetched ${lastFetched.toLocaleTimeString()}` : ""}
              {" · "}refreshes every 60s
            </p>
          </>
        )}
      </div>
    </div>
  );
}
