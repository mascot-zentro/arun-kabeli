import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRight, Building2 } from "lucide-react";

export const Route = createFileRoute("/subsidiaries/")({
  head: () => ({
    meta: [
      { title: "Subsidiaries — Arun Kabeli Power Limited" },
      { name: "description", content: "Subsidiary companies of Arun Kabeli Power Limited." },
      { property: "og:title", content: "Subsidiaries — Arun Kabeli Power" },
      { property: "og:url", content: "/subsidiaries" },
    ],
    links: [{ rel: "canonical", href: "/subsidiaries" }],
  }),
  component: SubsidiariesIndex,
});

function SubsidiariesIndex() {
  const { data: items, isLoading } = useQuery({
    queryKey: ["subsidiaries"],
    queryFn: async () =>
      (await supabase.from("subsidiaries").select("*").eq("is_visible", true).order("sort_order")).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="animated-mesh pb-24 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Our Group</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold md:text-6xl">Subsidiaries</h1>
          <p className="mt-4 max-w-xl text-lg text-primary-foreground/70 leading-relaxed">
            Arun Kabeli Power Limited operates through a group of focused subsidiaries — each advancing our mission of clean, reliable energy across Nepal.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">

          {isLoading && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border bg-card overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!items || items.length === 0) && (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
              <Building2 className="mb-4 h-12 w-12 opacity-30" />
              <p className="font-medium">No subsidiaries listed yet.</p>
            </div>
          )}

          {items && items.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s, idx) => (
                <Link
                  key={s.id}
                  to="/subsidiaries/$slug"
                  params={{ slug: s.slug }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                >
                  {/* Cover image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    {s.images?.[0] ? (
                      <img
                        src={s.images[0]}
                        alt={s.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full" style={{ background: "var(--gradient-mesh)" }} />
                    )}
                    {/* Ordinal overlay */}
                    <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary/80 backdrop-blur-sm">
                      <span className="font-mono text-xs font-bold text-white">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-xl font-bold leading-tight transition-colors group-hover:text-primary">
                      {s.name}
                    </h2>

                    {s.description && (
                      <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground leading-relaxed">
                        {s.description.split(/\n\s*\n/)[0]}
                      </p>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t pt-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5">
                        Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                      {s.website && (
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                          Website ↗
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
