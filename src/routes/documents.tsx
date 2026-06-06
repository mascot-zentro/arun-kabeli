import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, FileText } from "lucide-react";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Arun Kabeli Power" },
      { name: "description", content: "Annual reports, project documentation, and public filings from Arun Kabeli Power." },
      { property: "og:title", content: "Documents — Arun Kabeli Power" },
      { property: "og:url", content: "/documents" },
    ],
    links: [{ rel: "canonical", href: "/documents" }],
  }),
  component: Documents,
});

function formatSize(b?: number | null) {
  if (!b) return "—";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function Documents() {
  const [viewing, setViewing] = useState<{ url: string; title: string } | null>(null);
  const { data: docs } = useQuery({
    queryKey: ["public-documents"],
    queryFn: async () => (await supabase.from("documents").select("*").eq("is_public", true).order("uploaded_at", { ascending: false })).data ?? [],
  });

  // Popup is now triggered from the home page (index.tsx) — not here

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "category">("newest");
  const allCategories = Array.from(new Set((docs ?? []).map((d) => d.category).filter(Boolean))) as string[];
  const visibleDocs = (docs ?? [])
    .filter((d) => categoryFilter === "all" || d.category === categoryFilter)
    .slice()
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "category") return (a.category ?? "").localeCompare(b.category ?? "");
      const at = new Date(a.uploaded_at ?? 0).getTime();
      const bt = new Date(b.uploaded_at ?? 0).getTime();
      return sortBy === "oldest" ? at - bt : bt - at;
    });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="animated-mesh pb-16 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Resources</p>
          <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Documents</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          {docs && docs.length > 0 ? (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono uppercase tracking-wider text-muted-foreground">Category:</span>
                  <button onClick={() => setCategoryFilter("all")} className={`rounded-full border px-3 py-1 ${categoryFilter === "all" ? "border-accent bg-accent/20 text-foreground" : "bg-card hover:bg-secondary"}`}>All</button>
                  {allCategories.map((c) => (
                    <button key={c} onClick={() => setCategoryFilter(c)} className={`rounded-full border px-3 py-1 ${categoryFilter === c ? "border-accent bg-accent/20 text-foreground" : "bg-card hover:bg-secondary"}`}>{c}</button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <span className="font-mono uppercase tracking-wider text-muted-foreground">Sort:</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="rounded-md border bg-card px-2 py-1">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title (A–Z)</option>
                    <option value="category">Category (A–Z)</option>
                  </select>
                </label>
              </div>

              <div className="overflow-hidden rounded-xl border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-left font-mono text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Title</th>
                      <th className="p-4 hidden md:table-cell">Category</th>
                      <th className="p-4 hidden md:table-cell">Date</th>
                      <th className="p-4 hidden sm:table-cell">Size</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDocs.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="p-4"><div className="flex items-center gap-3"><FileText className="h-4 w-4 text-accent" /><span className="font-medium">{d.title}</span></div></td>
                        <td className="p-4 hidden md:table-cell text-muted-foreground">{d.category ?? "—"}</td>
                        <td className="p-4 hidden md:table-cell text-muted-foreground">{new Date(d.uploaded_at!).toLocaleDateString()}</td>
                        <td className="p-4 hidden sm:table-cell text-muted-foreground">{formatSize(d.file_size_bytes)}</td>
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-2">
                            <button onClick={() => setViewing({ url: d.file_url, title: d.title })} className="rounded-md p-2 text-muted-foreground hover:bg-accent/20 hover:text-foreground" title="View"><Eye className="h-4 w-4" /></button>
                            <a href={d.file_url} download className="rounded-md p-2 text-muted-foreground hover:bg-accent/20 hover:text-foreground" title="Download"><Download className="h-4 w-4" /></a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-muted-foreground">No documents available yet.</p>
          )}
        </div>
      </section>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="flex h-[90vh] max-w-6xl flex-col">

          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 pr-8">
              <span className="truncate">{viewing?.title}</span>
              {viewing && (
                <a href={viewing.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-md border px-2 py-1 text-xs font-normal hover:bg-secondary">Open in new tab</a>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <object data={viewing.url} type="application/pdf" className="min-h-0 flex-1 rounded-md border">
              <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewing.url)}&embedded=true`} className="h-full w-full rounded-md border" title={viewing.title} />
            </object>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
