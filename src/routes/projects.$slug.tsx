import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type React from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FileText, ArrowLeft, MapPin, Zap, Activity, X, ChevronLeft, ChevronRight, Download, Droplets, Mountain, Calendar, Users, Shield, Ruler, Clock, DollarSign, Leaf, Building2, Globe } from "lucide-react";

export const Route = createFileRoute("/projects/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Project — Arun Kabeli Power Limited` },
      { name: "description", content: `Hydropower project details — Arun Kabeli Power Limited.` },
      { property: "og:title", content: `Arun Kabeli Power Project` },
      { property: "og:url", content: `/projects/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/projects/${params.slug}` }],
  }),
  component: ProjectDetail,
});

const STATUS_COLORS: Record<string, string> = {
  planning:     "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  construction: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  operational:  "bg-green-500/20 text-green-300 border-green-400/30",
};

const ICON_MAP: Record<string, React.ElementType> = {
  zap: Zap, droplets: Droplets, mountain: Mountain, "map-pin": MapPin,
  calendar: Calendar, users: Users, activity: Activity, shield: Shield,
  ruler: Ruler, clock: Clock, dollar: DollarSign, leaf: Leaf,
  building: Building2, globe: Globe,
};

function FeatureIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? Zap;
  return <Icon className="h-5 w-5 text-accent" />;
}

function ProjectDetail() {
  const { slug } = Route.useParams();
  const [lightbox, setLightbox] = useState<number | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects").select("*")
        .eq("slug", slug).eq("is_published", true).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: photos } = useQuery({
    queryKey: ["project-photos", project?.id],
    enabled: !!project?.id,
    queryFn: async () => {
      const [junctionRows, taggedRows] = await Promise.all([
        supabase.from("project_photos").select("photos(*)").eq("project_id", project!.id),
        supabase.from("photos").select("*").eq("project_id", project!.id),
      ]);
      const seen = new Set<string>();
      const merged: Array<{ id: string; url: string; alt_text: string | null; caption: string | null }> = [];
      for (const row of (junctionRows.data ?? [])) {
        const p = (row as any).photos;
        if (p && !seen.has(p.id)) { seen.add(p.id); merged.push(p); }
      }
      for (const p of (taggedRows.data ?? [])) {
        if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
      }
      return merged;
    },
  });

  const { data: docs } = useQuery({
    queryKey: ["project-docs", project?.id],
    enabled: !!project?.id,
    queryFn: async () =>
      (await supabase.from("project_documents").select("documents(*)").eq("project_id", project!.id)).data ?? [],
  });

  const allPhotos = photos ?? [];

  function prevPhoto() { setLightbox((i) => i !== null ? (i - 1 + allPhotos.length) % allPhotos.length : null); }
  function nextPhoto() { setLightbox((i) => i !== null ? (i + 1) % allPhotos.length : null); }

  // Loading
  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>
  );

  if (!project) return null;

  const paragraphs = (project.description ?? "").split(/\n\s*\n/).filter(Boolean);
  const statusKey = (project.status ?? "").toLowerCase();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ── Hero — full bleed with cover photo as background ── */}
      <section className="relative min-h-[60vh] overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {project.cover_photo_url ? (
            <>
              <img src={project.cover_photo_url} alt={project.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/75 to-primary/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-primary/30" />
            </>
          ) : (
            <div className="absolute inset-0 animated-mesh" />
          )}
        </div>
        {/* Dot texture */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        {/* Content */}
        <div className="relative mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-end px-6 pb-14 pt-36">
          <Link
            to="/projects"
            className="mb-8 inline-flex w-fit items-center gap-1.5 text-sm text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>

          {/* Status badge */}
          {project.status && (
            <span className={`mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold backdrop-blur-sm ${STATUS_COLORS[statusKey] ?? "bg-white/10 text-white border-white/20"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          )}

          <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            {project.name}
          </h1>

          {/* Key facts row */}
          <div className="mt-5 flex flex-wrap gap-5">
            {project.location && (
              <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="text-sm text-white">{project.location}</span>
              </div>
            )}
            {project.capacity_mw && (
              <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-accent" />
                <span className="text-sm text-white"><span className="font-mono font-bold">{project.capacity_mw}</span> MW Capacity</span>
              </div>
            )}
            {project.status && (
              <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Activity className="h-4 w-4 text-accent" />
                <span className="text-sm text-white">{project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Salient Features ── */}
      {(project as any).salient_features?.length > 0 && (
        <section className="border-b bg-secondary/30 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-8 font-display text-2xl font-bold">Salient Features</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {((project as any).salient_features as Array<{ id: string; icon: string; label: string; value: string }>).map((feat) => (
                <div key={feat.id} className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                    <FeatureIcon name={feat.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{feat.label}</p>
                    <p className="mt-0.5 font-medium leading-tight text-foreground">{feat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Description ── */}
      {paragraphs.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="space-y-5 text-muted-foreground leading-relaxed md:text-lg">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {allPhotos.length > 0 && (
        <section className="border-t bg-secondary/30 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-display text-3xl font-bold">Gallery</h2>
              <span className="font-mono text-sm text-muted-foreground">{allPhotos.length} photo{allPhotos.length !== 1 ? "s" : ""}</span>
            </div>
            {/* Masonry-style grid: first photo wider */}
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {allPhotos.map((photo, i) => (
                <button
                  key={photo.id ?? i}
                  onClick={() => setLightbox(i)}
                  className={`group overflow-hidden rounded-xl bg-muted ${i === 0 && allPhotos.length > 1 ? "sm:col-span-2 aspect-[16/7]" : "aspect-square"}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.alt_text ?? ""}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading={i < 3 ? "eager" : "lazy"}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Documents ── */}
      {docs && docs.filter((r: any) => r.documents).length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 font-display text-3xl font-bold">Documents</h2>
            <div className="space-y-2">
              {(docs as any[]).filter((r) => r.documents).map((row, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4 transition hover:border-primary/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <span className="flex-1 font-medium leading-tight">{row.documents.title}</span>
                  <a
                    href={row.documents.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          {allPhotos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevPhoto(); }} className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextPhoto(); }} className="absolute right-16 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <img
            src={allPhotos[lightbox].url}
            alt={allPhotos[lightbox].alt_text ?? ""}
            className="max-h-[88vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {allPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/50">
              {lightbox + 1} / {allPhotos.length}
            </div>
          )}
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
