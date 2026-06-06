import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, FileText, Search, X } from "lucide-react";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Arun Kabeli Power Limited" },
      { name: "description", content: "Annual reports, project documentation, and public filings from Arun Kabeli Power Limited." },
      { property: "og:title", content: "Documents — Arun Kabeli Power Limited" },
      { property: "og:url", content: "/documents" },
    ],
    links: [{ rel: "canonical", href: "/documents" }],
  }),
  component: Documents,
});

function fmtSize(b?: number | null) {
  if (!b) return null;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(s?: string | null) {
  if (!s) return null;
  return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function Documents() {
  const [viewing, setViewing] = useState<{ url: string; title: string } | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: docs } = useQuery({
    queryKey: ["public-documents"],
    queryFn: async () =>
      (await supabase.from("documents").select("*").eq("is_public", true).order("sort_order", { ascending: true })).data ?? [],
  });

  const categories = ["All", ...Array.from(new Set((docs ?? []).map((d) => d.category).filter(Boolean))) as string[]];

  const visible = (docs ?? []).filter((d) => {
    const matchCat = activeCategory === "All" || d.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || d.title.toLowerCase().includes(q) || (d.category ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Group by category for display
  const grouped: Record<string, typeof visible> = {};
  if (activeCategory !== "All" || search) {
    grouped["Results"] = visible;
  } else {
    for (const d of visible) {
      const cat = d.category ?? "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(d);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="animated-mesh pb-20 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Resources</p>
          <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Documents</h1>
          <p className="mt-4 max-w-xl text-lg text-primary-foreground/70 leading-relaxed">
            Annual reports, project documentation, and public filings.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">

          {/* Search + filter bar */}
          {docs && docs.length > 0 && (
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents…"
                  className="w-full rounded-lg border bg-card py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category pills */}
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
                        activeCategory === cat
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {docs && docs.length > 0 && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <FileText className="mb-3 h-10 w-10 opacity-20" />
              <p className="font-medium">No documents match your search.</p>
              <button onClick={() => { setSearch(""); setActiveCategory("All"); }} className="mt-2 text-sm text-primary hover:underline">
                Clear filters
              </button>
            </div>
          )}

          {/* Grouped document list */}
          <div className="space-y-10">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                {/* Category heading — only show when not filtered */}
                {activeCategory === "All" && !search && Object.keys(grouped).length > 1 && (
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="font-display text-lg font-bold">{cat}</h2>
                    <div className="h-px flex-1 bg-border" />
                    <span className="font-mono text-xs text-muted-foreground">{items.length} file{items.length !== 1 ? "s" : ""}</span>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                  {items.map((d, i) => (
                    <div
                      key={d.id}
                      className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/40 ${i !== 0 ? "border-t" : ""}`}
                    >
                      {/* Icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium leading-tight">{d.title}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          {d.category && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                              {d.category}
                            </span>
                          )}
                          {fmtDate(d.uploaded_at) && (
                            <span className="text-xs text-muted-foreground">{fmtDate(d.uploaded_at)}</span>
                          )}
                          {fmtSize(d.file_size_bytes) && (
                            <span className="font-mono text-xs text-muted-foreground">{fmtSize(d.file_size_bytes)}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => setViewing({ url: d.file_url, title: d.title })}
                          title="Preview"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <a
                          href={d.file_url}
                          download
                          title="Download"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {(!docs || docs.length === 0) && (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
              <FileText className="mb-4 h-12 w-12 opacity-20" />
              <p className="font-medium">No documents available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* PDF Viewer */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="flex h-[90vh] max-w-6xl flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 pr-8">
              <span className="truncate">{viewing?.title}</span>
              {viewing && (
                <a
                  href={viewing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-normal hover:bg-secondary"
                >
                  Open in new tab
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <object data={viewing.url} type="application/pdf" className="min-h-0 flex-1 rounded-md border">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewing.url)}&embedded=true`}
                className="h-full w-full rounded-md border"
                title={viewing.title}
              />
            </object>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
