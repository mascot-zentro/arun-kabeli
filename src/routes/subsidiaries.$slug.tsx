import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft, ExternalLink, X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [lightbox, setLightbox] = useState<number | null>(null);

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

  const images: string[] = s?.images ?? [];
  const paragraphs = s?.description
    ? s.description.split(/\n\s*\n/).filter(Boolean)
    : [];

  function prevImg() { setLightbox((i) => i !== null ? (i - 1 + images.length) % images.length : null); }
  function nextImg() { setLightbox((i) => i !== null ? (i + 1) % images.length : null); }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pb-24 pt-40">
        {/* Background: first image blurred, or mesh */}
        <div className="absolute inset-0 -z-0">
          {images[0] ? (
            <>
              <img src={images[0]} alt="" className="h-full w-full object-cover object-center" aria-hidden />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/80 to-primary/95" />
            </>
          ) : (
            <div className="absolute inset-0 animated-mesh" />
          )}
        </div>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="relative mx-auto max-w-7xl px-6 text-primary-foreground">
          <Link
            to="/subsidiaries"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-primary-foreground/60 transition hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All subsidiaries
          </Link>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
              <div className="h-14 w-96 animate-pulse rounded-lg bg-white/10" />
            </div>
          ) : (
            <>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-accent">Subsidiary</span>
              </div>
              <h1 className="mt-2 max-w-3xl font-display text-5xl font-bold leading-tight md:text-6xl">
                {s?.name}
              </h1>
              {s?.website && (
                <a
                  href={s.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Visit website <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Content ── */}
      {!isLoading && s && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-16 lg:grid-cols-[1fr_440px] lg:items-start">

              {/* Description */}
              <div>
                {paragraphs.length > 0 ? (
                  <div className="space-y-5 text-muted-foreground leading-relaxed md:text-lg">
                    {paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">No description added yet.</p>
                )}

                {/* Website CTA card */}
                {s.website && (
                  <div className="mt-10 flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                      <ExternalLink className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Official Website</p>
                      <p className="truncate text-xs text-muted-foreground">{s.website}</p>
                    </div>
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      Visit
                    </a>
                  </div>
                )}

                {/* Back link */}
                <div className="mt-10">
                  <Link
                    to="/subsidiaries"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to all subsidiaries
                  </Link>
                </div>
              </div>

              {/* Image gallery */}
              {images.length > 0 && (
                <div className="space-y-3">
                  {/* Hero image */}
                  <button
                    onClick={() => setLightbox(0)}
                    className="group block w-full overflow-hidden rounded-2xl bg-muted shadow-md"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={images[0]}
                        alt={s.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="eager"
                      />
                    </div>
                  </button>

                  {/* Thumbnail row */}
                  {images.length > 1 && (
                    <div className={`grid gap-3 ${images.length === 2 ? "grid-cols-1" : "grid-cols-3"}`}>
                      {images.slice(1).map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setLightbox(i + 1)}
                          className="group relative overflow-hidden rounded-xl bg-muted"
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={url}
                              alt={`${s.name} ${i + 2}`}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {images.length > 1 && (
                    <p className="text-center text-xs text-muted-foreground">
                      Click any image to enlarge · {images.length} photo{images.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImg(); }}
                className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImg(); }}
                className="absolute right-16 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <img
            src={images[lightbox]}
            alt={s?.name ?? ""}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/50">
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
