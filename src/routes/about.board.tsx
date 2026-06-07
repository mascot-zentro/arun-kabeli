import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AboutSubNav } from "./about";

export const Route = createFileRoute("/about/board")({
  head: () => ({
    meta: [
      { title: "Board of Directors — Arun Kabeli Power Limited" },
      { name: "description", content: "Meet the Board of Directors of Arun Kabeli Power Limited." },
      { property: "og:title", content: "Board of Directors — Arun Kabeli Power" },
      { property: "og:url", content: "/about/board" },
    ],
    links: [{ rel: "canonical", href: "/about/board" }],
  }),
  component: BoardPage,
});

type Member = {
  id: string;
  name: string;
  role: string | null;
  department: string | null;
  photo_url: string | null;
  message: string | null;
  bio: string | null;
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function BoardPage() {
  const { data: sections } = useQuery({
    queryKey: ["page-content"],
    queryFn: async () => (await supabase.from("page_content").select("*")).data ?? [],
  });
  const { data: team, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () =>
      (await supabase.from("team_members").select("*").eq("is_visible", true).order("sort_order")).data ?? [],
  });

  const c = (sections?.find((s) => s.section_key === "about.board")?.content_json ?? {}) as Record<string, string>;
  const eyebrow   = c.hero_eyebrow || c.eyebrow   || "About Us";
  const pageTitle = c.hero_title   || c.page_title || "Board of Directors";
  const intro     = c.intro        || c.intro_text || "";
  const memberIds = c.member_ids   ? c.member_ids.split(",").filter(Boolean) : [];

  const boardMembers: Member[] = memberIds.length > 0
    ? memberIds.map((id) => team?.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => m !== undefined) as Member[]
    : [];

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = boardMembers.find((m) => m.id === activeId) ?? boardMembers[0] ?? null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="animated-mesh pb-24 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold md:text-6xl">{pageTitle}</h1>
          {intro && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/70">{intro}</p>
          )}
        </div>
      </section>

      <AboutSubNav />

      {/* Loading */}
      {isLoading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && boardMembers.length === 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-xl border border-dashed bg-secondary/30 p-12 text-center text-muted-foreground">
              <p className="font-medium">No board members selected.</p>
              <p className="mt-1 text-sm">Go to <strong>Admin → Page content → About — Board of Directors</strong> to pick members.</p>
            </div>
          </div>
        </section>
      )}

      {/* Main layout */}
      {!isLoading && boardMembers.length > 0 && active && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">

              {/* ── Sidebar ── */}
              <nav className="lg:sticky lg:top-24">
                <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {boardMembers.length} Member{boardMembers.length !== 1 ? "s" : ""}
                </p>
                <ul className="rounded-xl border bg-card overflow-hidden shadow-sm">
                  {boardMembers.map((m, idx) => {
                    const isActive = active.id === m.id;
                    return (
                      <li key={m.id} className={idx !== 0 ? "border-t" : ""}>
                        <button
                          onClick={() => setActiveId(m.id)}
                          className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isActive ? "bg-primary" : "hover:bg-secondary/60"
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`h-9 w-9 shrink-0 overflow-hidden rounded-full text-xs font-bold flex items-center justify-center ${
                            isActive ? "ring-2 ring-accent ring-offset-2 ring-offset-primary" : ""
                          } ${!m.photo_url ? (isActive ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground") : ""}`}>
                            {m.photo_url
                              ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                              : <span>{initials(m.name)}</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-semibold leading-tight ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
                              {m.name}
                            </p>
                            <p className={`truncate text-xs leading-tight ${isActive ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {m.role}
                            </p>
                          </div>
                          {isActive && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* ── Detail card ── */}
              <div key={active.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">

                {/* Profile header */}
                <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-start">
                  {/* Photo */}
                  <div className="shrink-0">
                    <div className="h-32 w-32 overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-border sm:h-40 sm:w-40">
                      {active.photo_url
                        ? <img src={active.photo_url} alt={active.name} className="h-full w-full object-cover object-top" />
                        : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10">
                            <span className="font-display text-3xl font-bold text-primary">{initials(active.name)}</span>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="flex-1 pt-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-display text-2xl font-bold leading-tight text-foreground md:text-3xl">
                          {active.name}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-accent">{active.role}</p>
                        {active.department && (
                          <span className="mt-2 inline-block rounded-full border bg-secondary px-3 py-0.5 text-xs text-muted-foreground">
                            {active.department}
                          </span>
                        )}
                      </div>
                      {/* Ordinal */}
                      <span className="font-mono text-4xl font-bold text-muted/40 select-none">
                        {String(boardMembers.findIndex((m) => m.id === active.id) + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Message */}
                    {active.message && (
                      <div className="mt-5 border-l-2 border-accent pl-4">
                        <p className="font-display text-base italic leading-relaxed text-foreground/80">
                          "{active.message}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {active.bio && (
                  <>
                    <div className="mx-8 border-t" />
                    <div className="space-y-3 p-8 pt-6 text-muted-foreground leading-relaxed">
                      {active.bio.split("\n").filter(Boolean).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </>
                )}

                {/* No content placeholder */}
                {!active.bio && !active.message && (
                  <div className="mx-8 border-t px-0 py-6">
                    <p className="text-sm italic text-muted-foreground">No bio available.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
