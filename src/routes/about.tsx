import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Arun Kabeli Power Limited" },
      { name: "description", content: "Our mission, story, and team behind Arun Kabeli Power Limited's hydropower work in Nepal." },
      { property: "og:title", content: "About Arun Kabeli Power" },
      { property: "og:description", content: "Our mission and team behind sustainable hydropower in Nepal." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  const { data: team } = useQuery({
    queryKey: ["team"],
    queryFn: async () => (await supabase.from("team_members").select("*").eq("is_visible", true).order("sort_order")).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="animated-mesh pb-20 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">About Us</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold md:text-6xl">Engineering Nepal's clean energy transition.</h1>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Our Story</p>
            <h2 className="mt-3 font-display text-3xl font-bold">Built on the Arun & Kabeli rivers.</h2>
          </div>
          <div className="space-y-4 text-muted-foreground md:col-span-2 md:text-lg">
            <p>Arun Kabeli Power Limited was founded in 2011 with a singular mission: to harness Nepal's abundant Himalayan rivers into reliable, clean electricity for communities and industry.</p>
            <p>Over more than a decade, we've engineered hydropower infrastructure that respects the landscapes it draws energy from — partnering with local communities, government bodies, and global investors to deliver power at scale.</p>
            <p>Every megawatt we produce displaces fossil fuel imports and strengthens Nepal's energy independence.</p>
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3">
          {[
            { t: "Mission", d: "Deliver clean, reliable hydropower that strengthens Nepal's energy independence and community wellbeing." },
            { t: "Vision", d: "A Nepal powered entirely by its own renewable rivers — by 2040." },
            { t: "Values", d: "Engineering excellence, community partnership, environmental stewardship, transparency." },
          ].map((v) => (
            <div key={v.t} className="rounded-xl border bg-card p-8 shadow-sm">
              <h3 className="font-display text-2xl font-bold text-primary">{v.t}</h3>
              <p className="mt-3 text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {team && team.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Leadership</p>
            <h2 className="mt-2 font-display text-4xl font-bold">Our Team</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
              {team.map((m) => (
                <div key={m.id} className="text-center">
                  <div className="mx-auto aspect-square w-40 overflow-hidden rounded-full bg-muted">
                    {m.photo_url ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />}
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{m.name}</h3>
                  <p className="text-sm text-muted-foreground">{m.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
