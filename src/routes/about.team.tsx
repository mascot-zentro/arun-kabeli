import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AboutSubNav } from "./about";
import { useState } from "react";
import { X, ExternalLink } from "lucide-react";

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

type Member = {
  id: string;
  name: string;
  role: string | null;
  department: string | null;
  photo_url: string | null;
  message: string | null;
  bio: string | null;
  sort_order: number | null;
  is_visible: boolean | null;
};

function MemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border bg-background p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header band with centered avatar overlapping bottom */}
        <div className="relative h-32 w-full bg-gradient-to-r from-primary to-accent rounded-t-2xl flex items-end justify-center pb-0">
          <div className="absolute -bottom-10 h-20 w-20 overflow-hidden rounded-full border-4 border-card bg-muted shadow-lg">
            {member.photo_url
              ? <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
              : <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-14 text-center">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold">{member.name}</h2>
            {member.role && (
              <p className="mt-0.5 text-sm font-semibold text-primary">{member.role}</p>
            )}
            {member.department && (
              <span className="mt-2 inline-block rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-muted-foreground">
                {member.department}
              </span>
            )}
          </div>
          <div className="mb-6 border-b" />

          {member.message && (
            <blockquote className="relative mb-6 rounded-xl border-l-4 border-primary bg-primary/5 px-5 py-4">
              <span className="absolute -left-1 -top-3 font-display text-5xl leading-none text-primary/20">"</span>
              <p className="font-display text-base italic leading-relaxed text-foreground">
                {member.message}
              </p>
              <footer className="mt-2 text-xs text-muted-foreground">— {member.name}</footer>
            </blockquote>
          )}

          {member.bio && (
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed text-left">
              {member.bio.split("\n").filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {!member.message && !member.bio && (
            <p className="text-sm italic text-muted-foreground">No additional details available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamPage() {
  const [activeDept, setActiveDept] = useState<string>("All");
  const [selected, setSelected] = useState<Member | null>(null);

  const { data: sections } = useQuery({
    queryKey: ["page-content"],
    queryFn: async () => (await supabase.from("page_content").select("*")).data ?? [],
  });

  const { data: team, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () =>
      (await supabase.from("team_members").select("*").neq("is_visible", false).order("sort_order")).data ?? [],
  });

  const c = (sections?.find((s) => s.section_key === "about.team")?.content_json ?? {}) as Record<string, string>;
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
                <button
                  key={dept}
                  onClick={() => setActiveDept(dept)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeDept === dept
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
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

          {!isLoading && filtered.length === 0 && (
            <p className="text-muted-foreground">No team members found.</p>
          )}

          {filtered.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m as Member)}
                  className="group rounded-xl border bg-card p-6 shadow-sm text-left transition-all hover:border-primary/40 hover:shadow-md cursor-pointer"
                >
                  <div className="mx-auto aspect-square w-28 overflow-hidden rounded-full bg-muted">
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      : <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />}
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors">{m.name}</h3>
                    <p className="text-sm font-medium text-primary">{m.role}</p>
                    {m.department && <p className="mt-0.5 text-xs text-muted-foreground">{m.department}</p>}
                  </div>
                  {m.message && (
                    <p className="mt-3 text-center text-xs italic text-muted-foreground line-clamp-2">"{m.message}"</p>
                  )}
                  <p className="mt-3 text-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    View profile →
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <MemberModal member={selected} onClose={() => setSelected(null)} />
      )}

      <SiteFooter />
    </div>
  );
}
