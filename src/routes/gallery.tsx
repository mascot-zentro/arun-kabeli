import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Arun Kabeli Power" },
      { name: "description", content: "Photos from our hydropower projects across Nepal." },
      { property: "og:title", content: "Photo Gallery — Arun Kabeli Power" },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: Gallery,
});

function Gallery() {
  const [open, setOpen] = useState<string | null>(null);
  const { data: photos } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => (await supabase.from("photos").select("*").order("sort_order")).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="animated-mesh pb-16 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Visual Archive</p>
          <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Gallery</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          {photos && photos.length > 0 ? (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {photos.map((p) => (
                <button key={p.id} onClick={() => setOpen(p.url)} className="mb-4 block w-full overflow-hidden rounded-lg">
                  <img src={p.url} alt={p.alt_text ?? p.caption ?? ""} className="w-full transition hover:scale-105" loading="lazy" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No photos uploaded yet.</p>
          )}
        </div>
      </section>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0">
          {open && <img src={open} alt="" className="max-h-[90vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
      <SiteFooter />
    </div>
  );
}
