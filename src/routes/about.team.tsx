import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AboutSubNav } from "./about";
import { useState } from "react";

export const Route = createFileRoute("/about/team")({
  head: () => ({
    meta: [
      { title: "Our Team — Arun Kabeli Power Limited" },
      { name: "description", content: "Meet the full team behind Arun Kabeli Power Limited." },
      { property: "og:title", content: "Our Team — Arun Kabeli Power" },
      { property: "og:url", content: "/about/team" },
    ],
    links: [{ rel: "canonical", href: "/about/team" }],
  }),
  component: TeamPage,
});

function TeamPage() {
  const [activeDept, setActiveDept] = useState<string>("All");

  const { data: sections } = useQuery({
    queryKey: ["page-content"],
    queryFn: async () => (await supabase.from("page_content").select("*")).data ?? [],
  });
  const { data: team, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () =>
      (await supabase.from("team_members").select("*").eq("is_visible", true).order("sort_order")).data ?? [],
  });

  const c = (sections?.find((s) => s.section_key === "about.team")?.content_json ?? {}) as Record<string, string>;

  // Support both old keys and new keys
  const eyebrow   = c.eyebrow    || c.hero_eyebrow || "About Us";
  const pageTitle = c.page_title || c.hero_title   || "Our Team";
  const intro     = c.intro      || c.intro_text   || "";

  const departments = team
    ? ["All", ...Array.from(new Set(team.map((m) => m.department).filter(Boolean) as string[]))]
    : ["All"];
  const filtered = activeDept === "All" ? (team ?? []) : (team ?? []).filter((m) => m.department === activeDept);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="animated-mesh pb-20 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold md:text-6xl">{pageTitle}</h1>
        </div>
      </section>
      <AboutSubNav />
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          {intro && <p className="mb-10 max-w-3xl text-lg text-muted-foreground leading-relaxed">{intro}</p>}
          {departments.length > 2 && (
            <div className="mb-10 flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button key={dept} onClick={() => setActiveDept(dept)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${activeDept === dept ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary"}`}>
                  {dept}
                </button>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading…
            </div>
          )}
          {!isLoading && filtered.length === 0 && <p className="text-muted-foreground">No team members found.</p>}
          {filtered.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((m) => (
                <div key={m.id} className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                  <div className="mx-auto aspect-square w-28 overflow-hidden rounded-full bg-muted">
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      : <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />}
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-display text-lg font-bold">{m.name}</h3>
                    <p className="text-sm font-medium text-primary">{m.role}</p>
                    {m.department && <p className="mt-0.5 text-xs text-muted-foreground">{m.department}</p>}
                  </div>
                  {m.message && <p className="mt-3 text-center text-xs italic text-muted-foreground line-clamp-3">"{m.message}"</p>}
                  {m.bio && <p className="mt-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed">{m.bio}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
