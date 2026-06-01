import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AboutSubNav } from "./about";
import { ArrowRight, Zap, Droplets, Mountain, Users, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/about/")({
  head: () => ({
    meta: [
      { title: "About — Arun Kabeli Power Limited" },
      { name: "description", content: "Our mission, story, and team behind Arun Kabeli Power Limited's hydropower work in Nepal." },
    ],
  }),
  component: About,
});

function About() {
  const { data: photos } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () =>
      (await supabase.from("photos").select("id,url,alt_text,caption").order("sort_order").limit(6)).data ?? [],
  });

  const { data: pageContent } = useQuery({
    queryKey: ["page-content"],
    queryFn: async () => (await supabase.from("page_content").select("*")).data ?? [],
  });

  const storyC   = (pageContent?.find((s) => s.section_key === "about.story")?.content_json   ?? {}) as Record<string, string>;
  const missionC = (pageContent?.find((s) => s.section_key === "about.mission")?.content_json ?? {}) as Record<string, string>;

  const storyTitle = storyC.title || "Built on the Arun & Kabeli rivers.";
  const storyBody  = storyC.body  || "Arun Kabeli Power Limited was founded in 2011 with a singular mission: to harness Nepal's abundant Himalayan rivers into reliable, clean electricity for communities and industry.\n\nOver more than a decade, we've engineered hydropower infrastructure that respects the landscapes it draws energy from — partnering with local communities, government bodies, and global investors to deliver power at scale.\n\nEvery megawatt we produce displaces fossil fuel imports and strengthens Nepal's energy independence.";

  const cards = [
    {
      t: missionC.mission_title || "Mission",
      d: missionC.mission_body  || "Deliver clean, reliable hydropower that strengthens Nepal's energy independence and community wellbeing.",
      icon: Zap,
    },
    {
      t: missionC.vision_title  || "Vision",
      d: missionC.vision_body   || "A Nepal powered entirely by its own renewable rivers — by 2040.",
      icon: Mountain,
    },
    {
      t: "Values",
      d: "Engineering excellence, community partnership, environmental stewardship, transparency.",
      icon: Users,
    },
  ];

  const subPages = [
    { to: "/about/chairman" as const, label: "Message from Chairman", desc: "A word from our Chairman on vision and direction.", icon: "01" },
    { to: "/about/board"    as const, label: "Board of Directors",    desc: "The directors guiding our strategic decisions.",  icon: "02" },
    { to: "/about/team"     as const, label: "Our Team",              desc: "The full team driving our hydropower mission.",   icon: "03" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ── Hero ── */}
      <section className="animated-mesh pb-28 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">About Us</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold leading-tight md:text-6xl">
            Engineering Nepal's clean energy transition.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-primary-foreground/70 leading-relaxed">
            Since 2011, Arun Kabeli Power Limited has delivered sustainable run-of-river hydropower across the Himalayan watershed — powering communities and strengthening Nepal's energy independence.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/projects" className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 font-semibold text-accent-foreground hover:opacity-90 transition">
              Our Projects <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-foreground/10 transition">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      <AboutSubNav />

      {/* ── Our Story ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start">

            {/* Text */}
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Our Story</p>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">{storyTitle}</h2>
              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed md:text-lg">
                {storyBody.split("\n").filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Key facts strip */}
              <div className="mt-10 grid grid-cols-3 gap-4">
                {[
                  { n: "2011", l: "Founded" },
                  { n: "25MW", l: "Kabeli B-1" },
                  { n: "132KV", l: "Transmission" },
                ].map((f) => (
                  <div key={f.l} className="rounded-xl border bg-card p-4 text-center">
                    <p className="font-mono text-xl font-bold text-primary">{f.n}</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{f.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery grid */}
            <div>
              {photos && photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {photos.slice(0, 4).map((p, i) => (
                    <div
                      key={p.id}
                      className={`overflow-hidden rounded-xl bg-muted ${i === 0 ? "col-span-2 aspect-[16/7]" : "aspect-square"}`}
                    >
                      <img
                        src={p.url}
                        alt={p.alt_text ?? p.caption ?? "Arun Kabeli Power"}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Placeholder when no photos */
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 aspect-[16/7] rounded-xl animated-mesh" />
                  <div className="aspect-square rounded-xl bg-muted" />
                  <div className="aspect-square rounded-xl bg-muted" />
                </div>
              )}
              <Link to="/gallery" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent">
                View full gallery <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission / Vision / Values ── */}
      <section className="border-y bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Who we are</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Purpose-driven energy</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {cards.map((v) => (
              <div key={v.t} className="group rounded-2xl border bg-card p-8 shadow-sm transition-all hover:border-accent/40 hover:shadow-md">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-primary">{v.t}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Additional gallery strip (photos 4–6) ── */}
      {photos && photos.length > 4 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {photos.slice(4, 7).map((p) => (
                <div key={p.id} className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  <img
                    src={p.url}
                    alt={p.alt_text ?? p.caption ?? ""}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Sub-page cards ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Leadership</p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Meet the people behind our work.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {subPages.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group relative overflow-hidden rounded-2xl border bg-card p-8 shadow-sm transition-all hover:border-primary/30 hover:shadow-lg"
              >
                {/* Faint ordinal */}
                <span className="absolute right-5 top-4 font-mono text-5xl font-bold text-muted/30 select-none group-hover:text-primary/10 transition-colors">
                  {link.icon}
                </span>
                <h3 className="relative font-display text-xl font-bold group-hover:text-primary transition-colors">{link.label}</h3>
                <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{link.desc}</p>
                <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
