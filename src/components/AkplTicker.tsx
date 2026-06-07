import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

type StockData = {
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume: number;
};

const REFRESH_MS = 120_000; // 2 min — polite refresh rate

// Free CORS proxies to try in order
const proxies = (url: string) => [
  `https://corsproxy.io/?${encodeURIComponent(url)}`,
  `https://cors-anywhere.herokuapp.com/${url}`,
  `https://thingproxy.freeboard.io/fetch/${url}`,
];

// NEPSE stocklive page contains: AKPL 272 (30243) (0.6)
// Pattern: AKPL followed by LTP (volume) (change)
const NEPSE_LIVE = "https://www.nepalstock.com/api/nots/nepse-data/companyList";

// Parse AKPL from the nepalstock live text feed
function parseFromText(text: string): StockData | null {
  // Try JSON array format: [{symbol:"AKPL", ltp:..., ...}]
  try {
    const arr = JSON.parse(text);
    const list = Array.isArray(arr) ? arr : arr?.content ?? arr?.data ?? [];
    const akpl = list.find((s: any) =>
      (s.symbol ?? s.Symbol ?? s.securitySymbol ?? "").toUpperCase() === "AKPL"
    );
    if (akpl) {
      const price     = Number(akpl.ltp ?? akpl.lastTradedPrice ?? akpl.closingPrice ?? akpl.close ?? 0);
      const prevClose = Number(akpl.previousClose ?? akpl.previousClosingPrice ?? akpl.prevClose ?? 0);
      const change    = price && prevClose ? +(price - prevClose).toFixed(2) : Number(akpl.pointChange ?? akpl.change ?? 0);
      const pct       = prevClose ? +((change / prevClose) * 100).toFixed(2) : Number(akpl.percentageChange ?? akpl.changePercent ?? 0);
      const vol       = Number(akpl.totalTradedQuantity ?? akpl.volume ?? akpl.qty ?? 0);
      if (price > 0) return { price, prevClose, change, changePercent: pct, volume: vol };
    }
  } catch { /* not JSON */ }

  // Try plain text pattern: AKPL 272 (30243) (0.6)
  const m = text.match(/AKPL\s+([\d.]+)\s+\(([\d,]+)\)\s+\(([-\d.]+)\)/);
  if (m) {
    const price  = parseFloat(m[1]);
    const vol    = parseInt(m[2].replace(/,/g, ""));
    const change = parseFloat(m[3]);
    return { price, prevClose: 0, change, changePercent: 0, volume: vol };
  }
  return null;
}

async function fetchPrice(): Promise<StockData> {
  const urls = [
    // Try multiple NEPSE endpoints via multiple proxies
    "https://www.nepalstock.com/api/nots/nepse-data/companyList",
    "https://www.nepalstock.com/api/nots/securityDailyTradeStat/2757",
    "https://www.nepalstock.com/stocklive",
  ];

  for (const url of urls) {
    for (const proxyUrl of proxies(url)) {
      try {
        const res = await fetch(proxyUrl, {
          headers: { "X-Requested-With": "XMLHttpRequest" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const text = await res.text();
        const parsed = parseFromText(text);
        if (parsed && parsed.price > 0) return parsed;
      } catch { /* try next */ }
    }
  }
  throw new Error("All sources failed");
}

export function AkplTicker({ compact = false }: { compact?: boolean }) {
  const [data, setData]           = useState<StockData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  async function load() {
    setError(false);
    try {
      const d = await fetchPrice();
      setData(d);
      setLastFetched(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const up   = !!data && data.change > 0;
  const down = !!data && data.change < 0;

  /* ── Compact pill ── */
  if (compact) {
    return (
      <a href="https://www.nepalstock.com/company/detail/2757" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs backdrop-blur-sm transition hover:bg-white/15"
        title="AKPL live price — Nepal Stock Exchange"
      >
        <span className="font-mono font-semibold text-white">AKPL</span>
        {loading && !data && <span className="text-white/40 text-[10px]">loading…</span>}
        {error   && !data && <span className="text-white/40 text-[10px]">—</span>}
        {data && (
          <>
            <span className="font-mono font-bold text-white">Rs.{data.price.toFixed(2)}</span>
            <span className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold ${up ? "text-green-400" : down ? "text-red-400" : "text-white/60"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {data.changePercent !== 0 ? `${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%` : data.change !== 0 ? `${data.change >= 0 ? "+" : ""}${data.change.toFixed(2)}` : "LTP"}
            </span>
          </>
        )}
      </a>
    );
  }

  /* ── Full card ── */
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b bg-secondary/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : error && !data ? "bg-red-400" : "bg-green-500 animate-pulse"}`} />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">NEPSE · Live</span>
        </div>
        <button onClick={load} title="Refresh" className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="px-5 py-5">
        {/* Loading skeleton */}
        {loading && !data && (
          <div className="space-y-3">
            <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        )}

        {/* Error */}
        {error && !data && (
          <p className="text-sm text-muted-foreground">
            Market data unavailable —{" "}
            <a href="https://www.nepalstock.com/company/detail/2757" target="_blank" rel="noopener noreferrer" className="text-primary underline">view on NEPSE</a>
          </p>
        )}

        {/* Data */}
        {data && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">Arun Kabeli Power Ltd.</p>
                <p className="mt-0.5 font-mono text-4xl font-bold tracking-tight">Rs.{data.price.toFixed(2)}</p>
              </div>
              {(data.change !== 0 || data.changePercent !== 0) && (
                <div className={`flex flex-col items-end rounded-xl px-3 py-2 ${up ? "bg-green-500/10" : down ? "bg-red-500/10" : "bg-secondary"}`}>
                  <div className={`flex items-center gap-1 text-lg font-bold ${up ? "text-green-600 dark:text-green-400" : down ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                    {up ? <TrendingUp className="h-5 w-5" /> : down ? <TrendingDown className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                    {data.change >= 0 ? "+" : ""}{data.change.toFixed(2)}
                  </div>
                  {data.changePercent !== 0 && (
                    <p className={`text-sm font-semibold ${up ? "text-green-600 dark:text-green-400" : down ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                      {data.changePercent >= 0 ? "+" : ""}{data.changePercent.toFixed(2)}%
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Previous Close</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{data.prevClose > 0 ? `Rs.${data.prevClose.toFixed(2)}` : "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Volume</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{data.volume > 0 ? data.volume.toLocaleString() : "—"}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 font-mono text-xs font-bold text-primary">AKPL</span>
                <span className="text-xs text-muted-foreground">Hydro Power · NEPSE</span>
              </div>
              <a href="https://www.nepalstock.com/company/detail/2757" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground underline hover:text-primary">
                View on NEPSE ↗
              </a>
            </div>

            {lastFetched && (
              <p className="mt-3 text-[10px] text-muted-foreground/60">
                Fetched {lastFetched.toLocaleTimeString()} · refreshes every 2 min
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
