import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AboutSubNav } from "./about";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/about/subsidiaries")({
  head: () => ({
    meta: [
      { title: "Subsidiaries — Arun Kabeli Power Limited" },
      { name: "description", content: "Subsidiary companies of Arun Kabeli Power Limited." },
      { property: "og:title", content: "Subsidiaries — Arun Kabeli Power" },
      { property: "og:url", content: "/about/subsidiaries" },
    ],
    links: [{ rel: "canonical", href: "/about/subsidiaries" }],
  }),
  component: SubsidiariesPage,
});

function SubsidiariesPage() {
  const { data: items, isLoading } = useQuery({
    queryKey: ["subsidiaries-public"],
    queryFn: async () =>
      (await supabase.from("subsidiaries").select("*").eq("is_visible", true).order("sort_order")).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="animated-mesh pb-20 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">About Us</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold md:text-6xl">Subsidiaries</h1>
          {!isLoading && items && items.length > 0 && (
            <p className="mt-3 text-lg text-primary-foreground/80">
              {items.length} compan{items.length !== 1 ? "ies" : "y"}
            </p>
          )}
        </div>
      </section>

      <AboutSubNav />

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
            <div className="space-y-20">
              {items.map((s, idx) => (
                <article
                  key={s.id}
                  className={`grid gap-10 md:grid-cols-2 ${idx !== items.length - 1 ? "border-b pb-20" : ""}`}
                >
                  <div className={idx % 2 === 1 ? "md:order-2" : ""}>
                    {s.images && s.images.length > 0 ? (
                      <div className="grid gap-3">
                        <img
                          src={s.images[0]}
                          alt={s.name}
                          className="aspect-[4/3] w-full rounded-xl object-cover shadow-md"
                          loading="lazy"
                        />
                        {s.images[1] && (
                          <img
                            src={s.images[1]}
                            alt={s.name}
                            className="aspect-[16/9] w-full rounded-xl object-cover shadow-md"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-primary to-accent" />
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <h2 className="font-display text-3xl font-bold md:text-4xl">{s.name}</h2>
                    {s.website && (
                      <a
                        href={s.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Visit website <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {s.description && (
                      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed md:text-lg">
                        {s.description.split(/\n\s*\n/).filter(Boolean).map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
