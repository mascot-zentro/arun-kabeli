import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

const EDGE_URL = "https://pwwutgitwynwlufcvkvz.supabase.co/functions/v1/akpl-price";

type StockData = {
  symbol: string;
  company_name: string;
  price: number;
  prev_close: number;
  change: number;
  change_pct: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  as_of: string;
};

async function fetchAkpl(): Promise<StockData> {
  const res = await fetch(EDGE_URL, {
    headers: {
      "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3d3V0Z2l0d3lud2x1ZmN2a3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTI4OTUsImV4cCI6MjA5NTE4ODg5NX0.08y9nE9kaVCUl2a-yATsxTwF2dya4iSdF-4uK1YfUEI",
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export function AkplTicker({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["akpl-price"],
    queryFn: fetchAkpl,
    refetchInterval: 5 * 60 * 1000,
    staleTime:       4 * 60 * 1000,
    retry: 2,
  });

  const price     = data?.price      ?? 0;
  const prev      = data?.prev_close ?? 0;
  const change    = data?.change     ?? 0;
  const changePct = data?.change_pct ?? 0;
  const volume    = data?.volume     ?? 0;
  const high      = data?.high       ?? 0;
  const low       = data?.low        ?? 0;
  const asOf      = data?.as_of      ?? "";
  const hasData   = price > 0;

  const up   = change > 0;
  const down = change < 0;

  /* ── Compact pill for hero bar ── */
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
        {isLoading && !hasData && <span className="text-white/40 text-[10px]">…</span>}
        {hasData && (
          <>
            <span className="font-mono font-bold text-white">Rs.{price.toFixed(2)}</span>
            <span className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold ${up ? "text-green-400" : down ? "text-red-400" : "text-white/60"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {changePct !== 0 ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : "LTP"}
            </span>
          </>
        )}
      </a>
    );
  }

  /* ── Full card ── */
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between border-b bg-secondary/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${
            isFetching ? "bg-yellow-400 animate-pulse"
            : isError || !hasData ? "bg-red-400"
            : "bg-green-500 animate-pulse"
          }`} />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            NEPSE · Live
          </span>
        </div>
        <button
          onClick={() => refetch()}
          title="Refresh"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="px-5 py-5">

        {/* Skeleton */}
        {isLoading && !hasData && (
          <div className="space-y-3">
            <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        )}

        {/* Error */}
        {!isLoading && (isError || !hasData) && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Market data unavailable.</p>
            <a
              href="https://www.nepalstock.com/company/detail/2757"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline hover:text-accent"
            >
              View AKPL on NEPSE ↗
            </a>
          </div>
        )}

        {/* Data */}
        {hasData && (
          <>
            {/* Price + change badge */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">Arun Kabeli Power Ltd.</p>
                <p className="mt-0.5 font-mono text-4xl font-bold tracking-tight">
                  Rs.{price.toFixed(2)}
                </p>
              </div>
              {change !== 0 && (
                <div className={`flex flex-col items-end rounded-xl px-3 py-2 ${up ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  <div className={`flex items-center gap-1 text-lg font-bold ${up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {up ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    {change >= 0 ? "+" : ""}{change.toFixed(2)}
                  </div>
                  {changePct !== 0 && (
                    <p className={`text-sm font-semibold ${up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Prev. Close</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{prev > 0 ? `Rs.${prev.toFixed(2)}` : "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Volume</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{volume > 0 ? volume.toLocaleString() : "—"}</p>
              </div>
              {high > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">High / Low</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold">
                    <span className="text-green-600 dark:text-green-400">{high.toFixed(2)}</span>
                    {" / "}
                    <span className="text-red-600 dark:text-red-400">{low.toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                  AKPL
                </span>
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

            {asOf && (
              <p className="mt-3 text-[10px] text-muted-foreground/60">
                As of {asOf} · refreshes every 5 min
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
