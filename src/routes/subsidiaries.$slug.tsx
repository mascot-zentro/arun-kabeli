import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/subsidiaries/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Subsidiary — Arun Kabeli Power Limited` },
      { name: "description", content: "Subsidiary company of Arun Kabeli Power Limited." },
      { property: "og:url", content: `/subsidiaries/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/subsidiaries/${params.slug}` }],
  }),
  component: SubsidiaryDetail,
});

function SubsidiaryDetail() {
  const { slug } = Route.useParams();

  const { data: s, isLoading } = useQuery({
    queryKey: ["subsidiary", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("subsidiaries")
        .select("*")
        .eq("slug", slug)
        .eq("is_visible", true)
        .maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="animated-mesh pb-20 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <Link
            to="/subsidiaries"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-primary-foreground/70 transition hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All subsidiaries
          </Link>
          {isLoading ? (
            <div className="h-12 w-64 animate-pulse rounded-lg bg-white/10" />
          ) : (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Subsidiary</p>
              <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold md:text-6xl">{s?.name}</h1>
              {s?.website && (
                <a
                  href={s.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  Visit website <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading…
            </div>
          )}

          {s && (
            <div className="grid gap-16 lg:grid-cols-[1fr_420px]">
              {/* Text */}
              <div>
                {s.description && (
                  <div className="space-y-5 text-muted-foreground leading-relaxed md:text-lg">
                    {s.description.split(/\n\s*\n/).filter(Boolean).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Images */}
              {s.images && s.images.length > 0 && (
                <div className="space-y-4">
                  {s.images.map((url: string, i: number) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${s.name} ${i + 1}`}
                      className="w-full rounded-2xl object-cover shadow-md"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
