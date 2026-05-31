import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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

const BOARD_ROLES = ["director", "board", "chairman", "chairperson", "chair person", "chair", "vice chairman", "vice-chairman"];

function BoardPage() {
  const { data: team, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () =>
      (await supabase.from("team_members").select("*").eq("is_visible", true).order("sort_order")).data ?? [],
  });

  const { data: pageContent } = useQuery({
    queryKey: ["page-content", "about.board"],
    queryFn: async () => {
      const { data } = await supabase
        .from("page_content")
        .select("content_json")
        .eq("section_key", "about.board")
        .maybeSingle();
      return (data?.content_json as Record<string, string>) ?? {};
    },
  });

  const boardMembers = team?.filter((m) =>
    BOARD_ROLES.some((r) => m.role?.toLowerCase().includes(r))
  ) ?? [];

  const heroTitle = pageContent?.hero_title || "Board of Directors";
  const heroEyebrow = pageContent?.hero_eyebrow || "About Us";
  const introText = pageContent?.intro_text;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="animated-mesh pb-20 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{heroEyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold md:text-6xl">
            {heroTitle}
          </h1>
          {introText && (
            <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">{introText}</p>
          )}
        </div>
      </section>

      <AboutSubNav />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading…
            </div>
          )}

          {!isLoading && boardMembers.length === 0 && (
            <p className="text-muted-foreground">
              No board members found. Add team members with roles like "Director" or "Chairman" in the admin panel.
            </p>
          )}

          {boardMembers.length > 0 && (
            <div className="space-y-12">
              {boardMembers.map((m, idx) => (
                <div
                  key={m.id}
                  className={`grid gap-10 md:grid-cols-[220px_1fr] ${idx !== boardMembers.length - 1 ? "border-b pb-12" : ""}`}
                >
                  <div className="flex flex-col items-center gap-4 md:items-start">
                    <div className="h-48 w-48 overflow-hidden rounded-2xl bg-muted shadow-md">
                      {m.photo_url
                        ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                        : <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />}
                    </div>
                    <div className="text-center md:text-left">
                      <p className="font-display text-lg font-bold">{m.name}</p>
                      <p className="text-sm font-medium text-primary">{m.role}</p>
                      {m.department && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{m.department}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-4">
                    {m.message && (
                      <blockquote className="relative rounded-xl border-l-4 border-primary bg-primary/5 px-6 py-4">
                        <span className="absolute -left-1 -top-3 font-display text-5xl leading-none text-primary/30">"</span>
                        <p className="font-display text-lg italic leading-relaxed text-foreground">
                          {m.message}
                        </p>
                      </blockquote>
                    )}
                    {m.bio ? (
                      <div className="space-y-3 text-muted-foreground leading-relaxed">
                        {m.bio.split("\n").filter(Boolean).map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No bio added yet.</p>
                    )}
                  </div>
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
