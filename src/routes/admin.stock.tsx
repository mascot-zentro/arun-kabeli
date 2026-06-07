import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Save, RefreshCw, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/stock")({ component: AdminStock });

function AdminStock() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["akpl-price"],
    queryFn: async () => {
      const { data } = await supabase.from("akpl_price").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState({
    price:      "",
    prev_close: "",
    change:     "",
    change_pct: "",
    volume:     "",
    as_of:      "",
  });
  const [saving, setSaving] = useState(false);

  // Pre-fill form from DB values when loaded
  function loadFromDB() {
    if (!data) return;
    setForm({
      price:      String(data.price      ?? ""),
      prev_close: String(data.prev_close ?? ""),
      change:     String(data.change     ?? ""),
      change_pct: String(data.change_pct ?? ""),
      volume:     String(data.volume     ?? ""),
      as_of:      data.as_of ?? "",
    });
  }

  // Auto-calculate change when price + prev_close filled
  function handlePrice(price: string) {
    const p  = parseFloat(price);
    const pr = parseFloat(form.prev_close);
    if (p && pr) {
      const ch  = +(p - pr).toFixed(2);
      const pct = +((ch / pr) * 100).toFixed(2);
      setForm((f) => ({ ...f, price, change: String(ch), change_pct: String(pct) }));
    } else {
      setForm((f) => ({ ...f, price }));
    }
  }

  function handlePrev(prev_close: string) {
    const p  = parseFloat(form.price);
    const pr = parseFloat(prev_close);
    if (p && pr) {
      const ch  = +(p - pr).toFixed(2);
      const pct = +((ch / pr) * 100).toFixed(2);
      setForm((f) => ({ ...f, prev_close, change: String(ch), change_pct: String(pct) }));
    } else {
      setForm((f) => ({ ...f, prev_close }));
    }
  }

  async function save() {
    if (!form.price) { toast.error("Price is required"); return; }
    setSaving(true);
    const now = new Date();
    const asOf = form.as_of || now.toLocaleString("en-US", {
      timeZone: "Asia/Kathmandu", dateStyle: "medium", timeStyle: "short",
    });
    const { error } = await supabase.from("akpl_price").upsert({
      id:         1,
      price:      parseFloat(form.price),
      prev_close: parseFloat(form.prev_close) || 0,
      change:     parseFloat(form.change)     || 0,
      change_pct: parseFloat(form.change_pct) || 0,
      volume:     parseInt(form.volume)        || 0,
      as_of:      asOf,
      updated_at: now.toISOString(),
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("AKPL price updated");
      qc.invalidateQueries({ queryKey: ["akpl-price"] });
    }
  }

  const price     = Number(data?.price      ?? 0);
  const changePct = Number(data?.change_pct ?? 0);
  const up = changePct > 0;
  const down = changePct < 0;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">AKPL Stock Price</h1>
          <p className="text-muted-foreground">Manually update the live price shown on the home page.</p>
        </div>
        <a
          href="https://www.nepalstock.com/company/detail/2757"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-secondary"
        >
          <ExternalLink className="h-4 w-4" /> NEPSE ↗
        </a>
      </div>

      {/* Current value card */}
      <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Current stored price</p>
            {isLoading ? (
              <div className="mt-1 h-9 w-40 animate-pulse rounded-lg bg-muted" />
            ) : price > 0 ? (
              <div className="mt-1 flex items-baseline gap-3">
                <p className="font-mono text-3xl font-bold">Rs.{price.toFixed(2)}</p>
                <span className={`flex items-center gap-1 text-sm font-semibold ${up ? "text-green-600" : down ? "text-red-600" : "text-muted-foreground"}`}>
                  {up ? <TrendingUp className="h-4 w-4" /> : down ? <TrendingDown className="h-4 w-4" /> : null}
                  {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                </span>
              </div>
            ) : (
              <p className="mt-1 text-muted-foreground">No price set yet</p>
            )}
            {data?.as_of && <p className="mt-1 text-xs text-muted-foreground">As of {data.as_of}</p>}
          </div>
          <button
            onClick={loadFromDB}
            className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs hover:bg-secondary"
            title="Load DB values into form"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Load into form
          </button>
        </div>
      </div>

      {/* Edit form */}
      <div className="mt-5 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Update price</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">LTP / Closing Price *</span>
            <input
              type="number" step="0.01"
              value={form.price}
              onChange={(e) => handlePrice(e.target.value)}
              placeholder="e.g. 276.50"
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Previous Close</span>
            <input
              type="number" step="0.01"
              value={form.prev_close}
              onChange={(e) => handlePrev(e.target.value)}
              placeholder="e.g. 269.70"
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Change</span>
            <input
              type="number" step="0.01"
              value={form.change}
              onChange={(e) => setForm((f) => ({ ...f, change: e.target.value }))}
              placeholder="Auto-calculated"
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Change %</span>
            <input
              type="number" step="0.01"
              value={form.change_pct}
              onChange={(e) => setForm((f) => ({ ...f, change_pct: e.target.value }))}
              placeholder="Auto-calculated"
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Volume</span>
            <input
              type="number"
              value={form.volume}
              onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))}
              placeholder="e.g. 113753"
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">As of (date/time label)</span>
            <input
              type="text"
              value={form.as_of}
              onChange={(e) => setForm((f) => ({ ...f, as_of: e.target.value }))}
              placeholder="Jun 8, 2026 · 3:00 PM"
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Change and Change % are auto-calculated when you enter LTP and Previous Close. You can also override them manually.</p>
        <button
          onClick={save}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save price"}
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-5 rounded-xl border border-accent/20 bg-accent/5 p-5 text-sm">
        <p className="font-semibold text-foreground">How to update daily</p>
        <ol className="mt-2 space-y-1 text-muted-foreground list-decimal list-inside">
          <li>Visit <a href="https://www.nepalstock.com/company/detail/2757" target="_blank" rel="noopener noreferrer" className="text-primary underline">NEPSE AKPL page ↗</a> after 3 PM on trading days</li>
          <li>Note the LTP, Previous Close, Volume</li>
          <li>Enter them here — Change % is auto-calculated</li>
          <li>Click Save — the home page ticker updates immediately</li>
        </ol>
      </div>
    </div>
  );
}
