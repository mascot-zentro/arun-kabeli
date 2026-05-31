import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AboutSubNav } from "./about";

export const Route = createFileRoute("/about/chairman")({
  head: () => ({
    meta: [
      { title: "Message from Chairman — Arun Kabeli Power Limited" },
      { name: "description", content: "A message from the Chairman of Arun Kabeli Power Limited." },
      { property: "og:title", content: "Message from Chairman — Arun Kabeli Power" },
      { property: "og:url", content: "/about/chairman" },
    ],
    links: [{ rel: "canonical", href: "/about/chairman" }],
  }),
  component: ChairmanPage,
});

const CHAIRMAN_ROLES = ["chairman", "chairperson", "chair person", "chair"];

function ChairmanPage() {
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () =>
      (await supabase.from("team_members").select("*").eq("is_visible", true).order("sort_order")).data ?? [],
  });

  const { data: pageContent } = useQuery({
    queryKey: ["page-content", "about.chairman"],
    queryFn: async () => {
      const { data } = await supabase
        .from("page_content")
        .select("content_json")
        .eq("section_key", "about.chairman")
        .maybeSingle();
      if (!data?.content_json) return {};
      const raw = data.content_json;
      if (typeof raw === "string") {
        try { return JSON.parse(raw) as Record<string, string>; } catch { return {}; }
      }
      return raw as Record<string, string>;
    },
  });

  const chairman = team?.find((m) =>
    CHAIRMAN_ROLES.some((r) => m.role?.toLowerCase().includes(r))
  );

  const heroTitle = pageContent?.hero_title || "Message from the Chairman";
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
        <div className="mx-auto max-w-5xl px-6">
          {teamLoading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading…
            </div>
          )}

          {!teamLoading && !chairman && (
            <p className="text-muted-foreground">
              No Chairman entry found. Add a team member with a "Chairman" role in the admin panel.
            </p>
          )}

          {chairman && (
            <div className="grid gap-16 md:grid-cols-[280px_1fr]">
              {/* Portrait */}
              <div className="flex flex-col items-center gap-4 md:items-start">
                <div className="h-64 w-64 overflow-hidden rounded-2xl bg-muted shadow-lg">
                  {chairman.photo_url
                    ? <img src={chairman.photo_url} alt={chairman.name} className="h-full w-full object-cover" />
                    : <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />}
                </div>
                <div className="text-center md:text-left">
                  <p className="font-display text-xl font-bold">{chairman.name}</p>
                  <p className="text-sm font-medium text-primary">{chairman.role}</p>
                  {chairman.department && (
                    <p className="text-xs text-muted-foreground">{chairman.department}</p>
                  )}
                </div>
              </div>

              {/* Message body */}
              <div>
                {chairman.message && (
                  <blockquote className="relative mb-8 rounded-xl border-l-4 border-primary bg-primary/5 p-6">
                    <span className="absolute -left-1 -top-3 font-display text-6xl leading-none text-primary/30">"</span>
                    <p className="font-display text-xl font-medium italic leading-relaxed text-foreground">
                      {chairman.message}
                    </p>
                    <footer className="mt-4 text-sm text-muted-foreground">— {chairman.name}</footer>
                  </blockquote>
                )}
                {chairman.bio ? (
                  <div className="space-y-4 text-muted-foreground md:text-lg leading-relaxed">
                    {chairman.bio.split("\n").filter(Boolean).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No bio added yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
