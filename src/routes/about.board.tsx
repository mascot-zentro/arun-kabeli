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
    ? memberIds.map((id) => team?.find((m) => m.id === id)).filter((m): m is Member => m !== undefined)
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
            <p className="mt-5 max-w-2xl text-base text-primary-foreground/70 leading-relaxed">{intro}</p>
          )}
        </div>
      </section>

      <AboutSubNav />

      {/* Loading */}
      {isLoading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && boardMembers.length === 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="rounded-xl border border-dashed bg-secondary/30 p-12 text-center text-muted-foreground">
              <p className="font-medium">No board members selected.</p>
              <p className="mt-1 text-sm">Go to <strong>Admin → Page content → About — Board of Directors</strong> to pick members.</p>
            </div>
          </div>
        </section>
      )}

      {/* Board layout */}
      {!isLoading && boardMembers.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:items-start">

              {/* Left: member list */}
              <div className="lg:sticky lg:top-24">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {boardMembers.length} Member{boardMembers.length !== 1 ? "s" : ""}
                </p>
                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  {boardMembers.map((m, idx) => {
                    const isActive = active?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setActiveId(m.id)}
                        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                          idx !== 0 ? "border-t" : ""
                        } ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary"
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`h-10 w-10 shrink-0 overflow-hidden rounded-full ${isActive ? "ring-2 ring-accent ring-offset-1 ring-offset-primary" : ""}`}>
                          {m.photo_url
                            ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                            : (
                              <div className={`flex h-full w-full items-center justify-center font-display text-sm font-bold ${isActive ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"}`}>
                                {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                              </div>
                            )}
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-semibold ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
                            {m.name}
                          </p>
                          <p className={`truncate text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {m.role}
                          </p>
                        </div>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: active member detail */}
              {active && (
                <div key={active.id} className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                  {/* Top band */}
                  <div className="relative h-28 w-full" style={{ background: "var(--gradient-mesh)" }}>
                    {/* Decorative line pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(90deg, white 0, white 1px, transparent 0, transparent 50%)", backgroundSize: "40px 100%" }} />
                    {/* Floating serial number */}
                    <span className="absolute right-6 top-4 font-mono text-6xl font-bold text-white/10 select-none">
                      {String(boardMembers.findIndex((m) => m.id === active.id) + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Photo overlapping band */}
                  <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex items-end gap-5">
                      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-muted shadow-lg">
                        {active.photo_url
                          ? <img src={active.photo_url} alt={active.name} className="h-full w-full object-cover" />
                          : (
                            <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-primary" style={{ background: "var(--gradient-mesh)" }}>
                              {active.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                            </div>
                          )}
                      </div>
                      <div className="pb-1">
                        <h2 className="font-display text-2xl font-bold leading-tight">{active.name}</h2>
                        <p className="mt-0.5 text-sm font-semibold text-accent">{active.role}</p>
                        {active.department && (
                          <span className="mt-1.5 inline-block rounded-full border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                            {active.department}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mb-6 h-px w-full bg-border" />

                    {/* Message / quote */}
                    {active.message && (
                      <div className="mb-6 flex gap-3">
                        <div className="mt-0.5 h-full w-0.5 shrink-0 self-stretch rounded-full bg-accent" />
                        <p className="font-display text-lg italic leading-relaxed text-foreground">
                          "{active.message}"
                        </p>
                      </div>
                    )}

                    {/* Bio */}
                    {active.bio ? (
                      <div className="space-y-3 text-muted-foreground leading-relaxed">
                        {active.bio.split("\n").filter(Boolean).map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    ) : (
                      !active.message && (
                        <p className="text-sm italic text-muted-foreground">No bio available.</p>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
