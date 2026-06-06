import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Mountain } from "lucide-react";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Arun Kabeli Power Limited" },
      { name: "description", content: "Run-of-river hydropower projects across Nepal: operational, under construction, and planned." },
      { property: "og:title", content: "Hydropower Projects — Arun Kabeli Power" },
      { property: "og:description", content: "Our run-of-river hydropower portfolio across Nepal." },
      { property: "og:url", content: "/projects" },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
  component: Projects,
});

function Projects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await supabase.from("projects").select("*").eq("is_published", true).order("created_at", { ascending: true })).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="animated-mesh pb-20 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Portfolio</p>
          <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Our Projects</h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">Run-of-river hydropower projects across the Himalayan watershed.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : projects && projects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link key={p.id} to="/projects/$slug" params={{ slug: p.slug }} className="group glow-hover overflow-hidden rounded-xl border bg-card">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {p.cover_photo_url ? (
                      <img src={p.cover_photo_url} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-mesh)" }}><Mountain className="h-16 w-16 text-accent/60" /></div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-xl font-bold">{p.name}</h3>
                      <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium">{p.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{p.location}</p>
                    <p className="mt-3 font-mono text-2xl font-bold text-primary">{p.capacity_mw}<span className="text-sm text-accent"> MW</span></p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">No projects published yet.</p>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
