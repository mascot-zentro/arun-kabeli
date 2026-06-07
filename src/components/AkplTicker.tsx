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

const REFRESH_MS = 60_000;

// Uses Anthropic API to fetch NEPSE data server-side (bypasses all CORS restrictions)
async function fetchAkplPrice(): Promise<StockData> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: `You are a stock data extractor. Search for the current AKPL (Arun Kabeli Power Limited) share price on NEPSE. 
Return ONLY a valid JSON object with exactly these fields (no markdown, no explanation):
{"price": number, "prevClose": number, "change": number, "changePercent": number, "volume": number, "updatedAt": "string"}
Use 0 for any value you cannot find.`,
      messages: [{ role: "user", content: "Get current AKPL NEPSE live price, previous close, change, change percent, and volume. Return only JSON." }],
    }),
  });

  const data = await response.json();

  // Extract text from response
  const textContent = data.content
    ?.filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  if (!textContent) throw new Error("No text response");

  // Parse JSON from response
  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    symbol: "AKPL",
    price: Number(parsed.price ?? 0),
    prevClose: Number(parsed.prevClose ?? 0),
    change: Number(parsed.change ?? 0),
    changePercent: Number(parsed.changePercent ?? 0),
    volume: Number(parsed.volume ?? 0),
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
  };
}

export function AkplTicker({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  async function fetchData() {
    try {
      setError(false);
      const stock = await fetchAkplPrice();
      if (stock.price > 0) {
        setData(stock);
        setLastFetched(new Date());
      } else {
        throw new Error("Price is 0");
      }
    } catch {
      setError(true);
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

  if (compact) {
    return (
      <a
        href="https://www.nepalstock.com/company/detail/2757"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs backdrop-blur-sm transition hover:bg-white/15"
        title="AKPL live price — Nepal Stock Exchange"
      >
        <span className="font-mono font-semibold text-white">AKPL</span>
        {loading && !data && <span className="text-white/50">—</span>}
        {error && !data && <span className="text-red-400 text-[10px]">unavailable</span>}
        {data && (
          <>
            <span className="font-mono font-bold text-white">Rs.{data.price.toFixed(2)}</span>
            <span className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold ${up ? "text-green-400" : down ? "text-red-400" : "text-white/60"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {data.changePercent !== 0 ? `${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%` : "LTP"}
            </span>
          </>
        )}
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-secondary/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : error ? "bg-red-400" : "bg-green-500 animate-pulse"}`} />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">NEPSE · Live</span>
        </div>
        <button onClick={fetchData} className="text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="px-5 py-5">
        {loading && !data && (
          <div className="space-y-3">
            <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        )}

        {error && !data && (
          <div className="text-sm text-muted-foreground">
            Market data unavailable —{" "}
            <a href="https://www.nepalstock.com/company/detail/2757" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              check NEPSE directly
            </a>
          </div>
        )}

        {data && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">Arun Kabeli Power Ltd.</p>
                <p className="mt-0.5 font-mono text-4xl font-bold tracking-tight">Rs.{data.price.toFixed(2)}</p>
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
                {data.updatedAt ? `Market: ${new Date(data.updatedAt).toLocaleString("en-NP", { dateStyle: "medium", timeStyle: "short" })} · ` : ""}
                Fetched {lastFetched.toLocaleTimeString()} · refreshes every 60s
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
