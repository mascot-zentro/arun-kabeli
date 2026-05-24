import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News — Arun Kabeli Power" },
      { name: "description", content: "Latest announcements and updates from Arun Kabeli Power." },
      { property: "og:title", content: "News — Arun Kabeli Power" },
      { property: "og:url", content: "/news" },
    ],
    links: [{ rel: "canonical", href: "/news" }],
  }),
  component: News,
});

function News() {
  const { data: news } = useQuery({
    queryKey: ["news"],
    queryFn: async () => (await supabase.from("news").select("*").eq("is_published", true).order("published_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="animated-mesh pb-16 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Updates</p>
          <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">News</h1>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          {news && news.length > 0 ? (
            <div className="space-y-6">
              {news.map((n) => (
                <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="block overflow-hidden rounded-xl border bg-card md:flex">
                  {n.cover_image_url && <img src={n.cover_image_url} alt={n.title} className="aspect-video w-full object-cover md:w-64" loading="lazy" />}
                  <div className="p-6">
                    <p className="font-mono text-xs uppercase text-muted-foreground">{n.published_at ? new Date(n.published_at).toLocaleDateString() : ""}</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">{n.title}</h2>
                    {n.excerpt && <p className="mt-2 text-muted-foreground">{n.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : <p className="text-center text-muted-foreground">No news yet.</p>}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
