import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { X, ChevronLeft, ChevronRight, Search } from "lucide-react";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Arun Kabeli Power Limited" },
      { name: "description", content: "Photos from our hydropower projects across Nepal." },
      { property: "og:title", content: "Photo Gallery — Arun Kabeli Power Limited" },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: Gallery,
});

type Photo = {
  id: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
  project_id: string | null;
  uploaded_at: string | null;
  sort_order: number | null;
};

function Gallery() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeProject, setActiveProject] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"default" | "newest" | "oldest">("default");

  const { data: photos } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () =>
      (await supabase.from("photos").select("*, projects(name)").order("sort_order")).data ?? [],
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () =>
      (await supabase.from("projects").select("id, name").eq("is_published", true).order("sort_order")).data ?? [],
  });

  // Build filter list
  const projectFilters = [
    "All",
    "Untagged",
    ...(projects ?? []).map((p: any) => p.name),
  ];

  // Filter
  const filtered = (photos ?? []).filter((p: any) => {
    const projectName = p.projects?.name ?? null;
    const matchProject =
      activeProject === "All" ||
      (activeProject === "Untagged" && !projectName) ||
      projectName === activeProject;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (p.caption ?? "").toLowerCase().includes(q) ||
      (p.alt_text ?? "").toLowerCase().includes(q) ||
      (projectName ?? "").toLowerCase().includes(q);
    return matchProject && matchSearch;
  });

  // Sort
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sort === "newest") return new Date(b.uploaded_at ?? 0).getTime() - new Date(a.uploaded_at ?? 0).getTime();
    if (sort === "oldest") return new Date(a.uploaded_at ?? 0).getTime() - new Date(b.uploaded_at ?? 0).getTime();
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  function prevPhoto() { setLightboxIdx((i) => i !== null ? (i - 1 + sorted.length) % sorted.length : null); }
  function nextPhoto() { setLightboxIdx((i) => i !== null ? (i + 1) % sorted.length : null); }
  const lightboxPhoto = lightboxIdx !== null ? sorted[lightboxIdx] : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="animated-mesh pb-16 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Visual Archive</p>
          <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Gallery</h1>
          <p className="mt-4 text-primary-foreground/70">
            {(photos ?? []).length} photo{(photos ?? []).length !== 1 ? "s" : ""} from across our projects.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">

          {/* ── Controls bar ── */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            {/* Project filter pills */}
            <div className="flex flex-wrap gap-2">
              {projectFilters.map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveProject(name)}
                  className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
                    activeProject === name
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Search + sort */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search captions…"
                  className="w-44 rounded-lg border bg-card py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="rounded-lg border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="default">Default order</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

          {/* Result count */}
          {(search || activeProject !== "All") && (
            <p className="mb-5 text-xs text-muted-foreground">
              Showing {sorted.length} photo{sorted.length !== 1 ? "s" : ""}
              {activeProject !== "All" && ` in "${activeProject}"`}
              {search && ` matching "${search}"`}
            </p>
          )}

          {/* ── Masonry grid ── */}
          {sorted.length > 0 ? (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
              {sorted.map((p: any, idx: number) => (
                <button
                  key={p.id}
                  onClick={() => setLightboxIdx(idx)}
                  className="group relative mb-4 block w-full overflow-hidden rounded-xl bg-muted shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <img
                    src={p.url}
                    alt={p.alt_text ?? p.caption ?? ""}
                    className="w-full transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Caption overlay — always visible at bottom */}
                  {(p.caption || p.projects?.name) && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                      {p.caption && (
                        <p className="text-left text-xs font-medium leading-snug text-white">{p.caption}</p>
                      )}
                      {p.projects?.name && (
                        <span className="mt-1 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                          {p.projects.name}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
              <p className="font-medium">No photos match your filters.</p>
              <button
                onClick={() => { setActiveProject("All"); setSearch(""); }}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            className="absolute right-16 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Image */}
          <div className="flex max-h-[90vh] max-w-[88vw] flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.alt_text ?? lightboxPhoto.caption ?? ""}
              className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            {/* Caption + project tag in lightbox */}
            {(lightboxPhoto.caption || (lightboxPhoto as any).projects?.name) && (
              <div className="flex flex-col items-center gap-1.5 text-center">
                {lightboxPhoto.caption && (
                  <p className="max-w-lg text-sm text-white/90 leading-relaxed">{lightboxPhoto.caption}</p>
                )}
                {(lightboxPhoto as any).projects?.name && (
                  <span className="rounded-full bg-accent/20 px-3 py-0.5 text-xs font-semibold text-accent">
                    {(lightboxPhoto as any).projects.name}
                  </span>
                )}
              </div>
            )}
            {/* Counter */}
            <p className="font-mono text-xs text-white/40">
              {(lightboxIdx ?? 0) + 1} / {sorted.length}
            </p>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
