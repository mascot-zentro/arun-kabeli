import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRight } from "lucide-react";

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

      <section className="animated-mesh pb-20 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Our Group</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold md:text-6xl">Subsidiaries</h1>
          {!isLoading && items && items.length > 0 && (
            <p className="mt-3 text-lg text-primary-foreground/80">
              {items.length} compan{items.length !== 1 ? "ies" : "y"}
            </p>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading…
            </div>
          )}

          {!isLoading && (!items || items.length === 0) && (
            <p className="text-muted-foreground">No subsidiaries listed yet.</p>
          )}

          {items && items.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <Link
                  key={s.id}
                  to="/subsidiaries/$slug"
                  params={{ slug: s.slug }}
                  className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-lg"
                >
                  {/* Photo */}
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                    {s.images?.[0] ? (
                      <img
                        src={s.images[0]}
                        alt={s.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h2 className="font-display text-xl font-bold group-hover:text-primary transition-colors">
                      {s.name}
                    </h2>
                    {s.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                        {s.description.split(/\n\s*\n/)[0]}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </span>
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
