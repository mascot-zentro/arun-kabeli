import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, FileText, ChevronLeft, ChevronRight } from "lucide-react";

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

  const popupDocs = (docs ?? [])
    .filter((d: any) => d.show_as_popup)
    .sort((a: any, b: any) => (a.popup_sort_order ?? 0) - (b.popup_sort_order ?? 0));
  const [popupIdx, setPopupIdx] = useState<number | null>(null);

  useEffect(() => {
    if (popupDocs.length === 0) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("akpl-doc-popup-seen")) return;
    setPopupIdx(0);
    sessionStorage.setItem("akpl-doc-popup-seen", "1");
  }, [popupDocs.length]);

  const currentPopup = popupIdx !== null ? popupDocs[popupIdx] : null;

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
                  {docs.map((d) => (
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
          ) : (
            <p className="py-12 text-center text-muted-foreground">No documents available yet.</p>
          )}
        </div>
      </section>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="h-[90vh] max-w-6xl">
          <DialogHeader><DialogTitle>{viewing?.title}</DialogTitle></DialogHeader>
          {viewing && <iframe src={viewing.url} className="h-full w-full rounded-md border" title={viewing.title} />}
        </DialogContent>
      </Dialog>

      <Dialog open={currentPopup !== null} onOpenChange={(v) => !v && setPopupIdx(null)}>
        <DialogContent className="h-[85vh] max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 pr-8">
              <span>{currentPopup?.title}</span>
              {popupDocs.length > 1 && (
                <span className="font-mono text-xs text-muted-foreground">{(popupIdx ?? 0) + 1} / {popupDocs.length}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {currentPopup && (
            <iframe src={currentPopup.file_url} className="h-full w-full rounded-md border" title={currentPopup.title} />
          )}
          {popupDocs.length > 1 && (
            <div className="flex items-center justify-between border-t pt-3">
              <button
                onClick={() => setPopupIdx((i) => (i !== null && i > 0 ? i - 1 : i))}
                disabled={popupIdx === 0}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={() => {
                  if (popupIdx === null) return;
                  if (popupIdx < popupDocs.length - 1) setPopupIdx(popupIdx + 1);
                  else setPopupIdx(null);
                }}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                {popupIdx !== null && popupIdx < popupDocs.length - 1 ? (<>Next <ChevronRight className="h-4 w-4" /></>) : "Done"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
