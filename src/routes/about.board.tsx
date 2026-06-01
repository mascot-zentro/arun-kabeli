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

  const content = (sections?.find((s) => s.section_key === "about.board")?.content_json ?? {}) as Record<string, string>;
  const pageTitle = content.page_title || "Board of Directors";
  const eyebrow = content.eyebrow || "About Us";
  const intro = content.intro || "";
  const memberIds = content.member_ids ? content.member_ids.split(",").filter(Boolean) : [];
  type TeamMember = NonNullable<typeof team>[number];
  const boardMembers: TeamMember[] = memberIds.length > 0
    ? memberIds.map((id) => team?.find((m) => m.id === id)).filter((m): m is TeamMember => m !== undefined)
    : [];

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
          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading…
            </div>
          )}
          {!isLoading && boardMembers.length === 0 && (
            <div className="rounded-xl border border-dashed bg-secondary/30 p-10 text-center text-muted-foreground">
              <p className="font-medium">No board members selected.</p>
              <p className="mt-1 text-sm">Go to <strong>Admin → Page content → About — Board of Directors</strong> to pick members.</p>
            </div>
          )}
          {intro && <p className="mb-12 max-w-3xl text-lg text-muted-foreground leading-relaxed">{intro}</p>}
          {boardMembers.length > 0 && (
            <div className="space-y-12">
              {boardMembers.map((m, idx) => (
                <div key={m.id} className={`grid gap-10 md:grid-cols-[220px_1fr] ${idx !== boardMembers.length - 1 ? "border-b pb-12" : ""}`}>
                  <div className="flex flex-col items-center gap-4 md:items-start">
                    <div className="h-48 w-48 overflow-hidden rounded-2xl bg-muted shadow-md">
                      {m.photo_url
                        ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                        : <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />}
                    </div>
                    <div className="text-center md:text-left">
                      <p className="font-display text-lg font-bold">{m.name}</p>
                      <p className="text-sm font-medium text-primary">{m.role}</p>
                      {m.department && <p className="mt-0.5 text-xs text-muted-foreground">{m.department}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-4">
                    {m.message && (
                      <blockquote className="relative rounded-xl border-l-4 border-primary bg-primary/5 px-6 py-4">
                        <span className="absolute -left-1 -top-3 font-display text-5xl leading-none text-primary/30">"</span>
                        <p className="font-display text-lg italic leading-relaxed text-foreground">{m.message}</p>
                      </blockquote>
                    )}
                    {m.bio
                      ? <div className="space-y-3 text-muted-foreground leading-relaxed">{m.bio.split("\n").filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}</div>
                      : <p className="text-sm italic text-muted-foreground">No bio added yet. Edit in Team admin.</p>}
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
