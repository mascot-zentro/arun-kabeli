import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

export function AkplTicker({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["akpl-price"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("akpl_price")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // refetch every 5 min (synced with cron)
    staleTime:       4 * 60 * 1000,
  });

  const price    = Number(data?.price    ?? 0);
  const prev     = Number(data?.prev_close ?? 0);
  const change   = Number(data?.change   ?? 0);
  const changePct= Number(data?.change_pct ?? 0);
  const volume   = Number(data?.volume   ?? 0);
  const asOf     = data?.as_of ?? "";

  const up   = change > 0;
  const down = change < 0;
  const hasData = price > 0;

  /* ── Compact pill ── */
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
        {isLoading && <span className="text-white/40 text-[10px]">…</span>}
        {hasData && (
          <>
            <span className="font-mono font-bold text-white">Rs.{price.toFixed(2)}</span>
            <span className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold ${up ? "text-green-400" : down ? "text-red-400" : "text-white/60"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : down ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {changePct !== 0 ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : change !== 0 ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}` : "LTP"}
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
          <span className={`h-2 w-2 rounded-full ${isLoading || isFetching ? "bg-yellow-400 animate-pulse" : isError || !hasData ? "bg-red-400" : "bg-green-500 animate-pulse"}`} />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">NEPSE · Live</span>
        </div>
        <button onClick={() => refetch()} title="Refresh" className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="px-5 py-5">
        {/* Skeleton */}
        {isLoading && (
          <div className="space-y-3">
            <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        )}

        {/* Error / no data */}
        {!isLoading && (isError || !hasData) && (
          <p className="text-sm text-muted-foreground">
            {isError ? "Could not load data — " : "Price not yet fetched — "}
            <a href="https://www.nepalstock.com/company/detail/2757" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              view on NEPSE ↗
            </a>
          </p>
        )}

        {/* Data */}
        {!isLoading && hasData && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">Arun Kabeli Power Ltd.</p>
                <p className="mt-0.5 font-mono text-4xl font-bold tracking-tight">Rs.{price.toFixed(2)}</p>
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

            <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Previous Close</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{prev > 0 ? `Rs.${prev.toFixed(2)}` : "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Volume</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{volume > 0 ? volume.toLocaleString() : "—"}</p>
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

            {asOf && (
              <p className="mt-3 text-[10px] text-muted-foreground/60">
                As of {asOf} · auto-updates every 5 min during trading hours
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
