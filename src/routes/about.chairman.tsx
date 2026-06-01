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

function ChairmanPage() {
  const { data: sections } = useQuery({
    queryKey: ["page-content"],
    queryFn: async () => (await supabase.from("page_content").select("*")).data ?? [],
  });
  const { data: team, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () =>
      (await supabase.from("team_members").select("*").eq("is_visible", true).order("sort_order")).data ?? [],
  });

  const c = (sections?.find((s) => s.section_key === "about.chairman")?.content_json ?? {}) as Record<string, string>;

  // Support both old keys (hero_eyebrow, hero_title, intro_text) and new keys
  const eyebrow    = c.eyebrow      || c.hero_eyebrow || "About Us";
  const pageTitle  = c.page_title   || c.hero_title   || "Message from the Chairman";
  const pullQuote  = c.pull_quote   || c.intro_text   || "";
  const body       = c.body        || "";
  const memberId   = c.team_member_id || "";

  const chairman = memberId ? team?.find((m) => m.id === memberId) : null;

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
        <div className="mx-auto max-w-5xl px-6">
          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading…
            </div>
          )}
          {!isLoading && !chairman && !body && !pullQuote && (
            <div className="rounded-xl border border-dashed bg-secondary/30 p-10 text-center text-muted-foreground">
              <p className="font-medium">No content yet.</p>
              <p className="mt-1 text-sm">Go to <strong>Admin → Page content → About — Message from Chairman</strong> to set it up.</p>
            </div>
          )}
          {(chairman || body || pullQuote) && (
            <div className="grid gap-16 md:grid-cols-[280px_1fr]">
              {chairman && (
                <div className="flex flex-col items-center gap-4 md:items-start">
                  <div className="h-64 w-64 overflow-hidden rounded-2xl bg-muted shadow-lg">
                    {chairman.photo_url
                      ? <img src={chairman.photo_url} alt={chairman.name} className="h-full w-full object-cover" />
                      : <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />}
                  </div>
                  <div className="text-center md:text-left">
                    <p className="font-display text-xl font-bold">{chairman.name}</p>
                    <p className="text-sm font-medium text-primary">{chairman.role}</p>
                    {chairman.department && <p className="text-xs text-muted-foreground">{chairman.department}</p>}
                  </div>
                </div>
              )}
              <div>
                {pullQuote && (
                  <blockquote className="relative mb-8 rounded-xl border-l-4 border-primary bg-primary/5 p-6">
                    <span className="absolute -left-1 -top-3 font-display text-6xl leading-none text-primary/30">"</span>
                    <p className="font-display text-xl font-medium italic leading-relaxed text-foreground">{pullQuote}</p>
                    {chairman && <footer className="mt-4 text-sm text-muted-foreground">— {chairman.name}</footer>}
                  </blockquote>
                )}
                {body && (
                  <div className="space-y-4 text-muted-foreground md:text-lg leading-relaxed">
                    {body.split("\n").filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
                  </div>
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
