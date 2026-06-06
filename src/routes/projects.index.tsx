import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Mountain } from "lucide-react";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — Arun Kabeli Power Limited" },
      { name: "description", content: "Run-of-river hydropower projects across Nepal: operational, under construction, and planned." },
      { property: "og:title", content: "Hydropower Projects — Arun Kabeli Power" },
      { property: "og:url", content: "/projects" },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
  component: Projects,
});

const STATUS_COLORS: Record<string, string> = {
  planning:     "bg-yellow-500/15 text-yellow-700",
  construction: "bg-blue-500/15 text-blue-700",
  operational:  "bg-green-500/15 text-green-700",
};

function Projects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () =>
      (await supabase.from("projects").select("*").eq("is_published", true).order("sort_order", { ascending: true })).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="animated-mesh pb-20 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Portfolio</p>
          <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Our Projects</h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/70 leading-relaxed">
            Run-of-river hydropower projects across the Himalayan watershed — clean power for Nepal's future.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-xl border bg-card">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="space-y-3 p-6">
                    <div className="h-5 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                    <div className="h-7 w-1/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to="/projects/$slug"
                  params={{ slug: p.slug }}
                  className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {p.cover_photo_url ? (
                      <img
                        src={p.cover_photo_url}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-mesh)" }}>
                        <Mountain className="h-16 w-16 text-white/30" />
                      </div>
                    )}
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status ?? "planning"] ?? "bg-muted text-muted-foreground"}`}>
                      {p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "Planning"}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold leading-tight transition-colors group-hover:text-primary">
                      {p.name}
                    </h3>
                    {p.location && (
                      <p className="mt-1 text-sm text-muted-foreground">{p.location}</p>
                    )}
                    {p.capacity_mw && (
                      <p className="mt-3 font-mono text-2xl font-bold text-primary">
                        {p.capacity_mw}<span className="text-sm font-normal text-accent"> MW</span>
                      </p>
                    )}
                    {p.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
              <Mountain className="mb-4 h-12 w-12 opacity-20" />
              <p className="font-medium">No projects published yet.</p>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
