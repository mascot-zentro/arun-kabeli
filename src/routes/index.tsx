import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRight, Zap, Droplets, Mountain } from "lucide-react";
import logo from "@/assets/logo.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arun Kabeli Power Limited — Sustainable Hydropower in Nepal" },
      { name: "description", content: "Run-of-river hydropower projects powering Nepal since 2011. Clean, renewable energy from the Himalayas." },
      { property: "og:title", content: "Arun Kabeli Power Limited" },
      { property: "og:description", content: "Sustainable hydropower projects powering Nepal since 2011." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const { data: heroPhotos } = useQuery({
    queryKey: ["hero-photos"],
    queryFn: async () => (await supabase.from("photos").select("id,url,alt_text,caption").order("uploaded_at", { ascending: false }).limit(4)).data ?? [],
  });
  const { data: projects } = useQuery({
    queryKey: ["projects-featured"],
    queryFn: async () => (await supabase.from("projects").select("*").eq("is_published", true).order("sort_order").limit(3)).data ?? [],
  });
  const { data: news } = useQuery({
    queryKey: ["news-latest"],
    queryFn: async () => (await supabase.from("news").select("*").eq("is_published", true).order("published_at", { ascending: false }).limit(3)).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader transparent />

      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden animated-mesh">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-32 md:grid-cols-2 md:items-center">
          <div className="text-primary-foreground">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-accent">Est. 2011 · Nepal</p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-7xl">Powering Nepal with Himalayan rivers.</h1>
            <p className="mt-6 max-w-lg text-lg text-primary-foreground/80">Sustainable run-of-river hydropower delivering clean, reliable electricity to communities and industry across Nepal.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/projects" className="group inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-lg transition hover:opacity-90">
                Explore Projects <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link to="/contact" className="rounded-md border border-primary-foreground/30 px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-foreground/10">Partner With Us</Link>
            </div>
          </div>
          <HeroSlider photos={heroPhotos ?? []} />

        </div>
      </section>

      {/* STATS */}
      <section className="border-b bg-card py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-2 md:grid-cols-4">
          {[
            { k: "55", suffix: "MW", v: "Installed Capacity" },
            { k: "3", suffix: "+", v: "Active Projects" },
            { k: "14", suffix: "yrs", v: "In Operation" },
            { k: "100k", suffix: "+", v: "Households Served" },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <div className="font-mono text-5xl font-bold text-primary">{s.k}<span className="text-accent">{s.suffix}</span></div>
              <p className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Portfolio</p>
              <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Featured Projects</h2>
            </div>
            <Link to="/projects" className="hidden text-sm font-semibold text-primary hover:text-accent md:inline-flex">View all →</Link>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(projects ?? []).map((p) => (
              <Link key={p.id} to="/projects/$slug" params={{ slug: p.slug }} className="group glow-hover overflow-hidden rounded-xl border bg-card">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {p.cover_photo_url ? (
                    <img src={p.cover_photo_url} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-mesh)" }}><Mountain className="h-16 w-16 text-accent/60" /></div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold">{p.name}</h3>
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium">{p.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.location} · <span className="font-mono text-primary">{p.capacity_mw} MW</span></p>
                </div>
              </Link>
            ))}
            {(!projects || projects.length === 0) && (
              <p className="col-span-3 py-12 text-center text-muted-foreground">Projects will appear here once added.</p>
            )}
          </div>
        </div>
      </section>

      {/* ABOUT TEASER */}
      <section className="bg-secondary/40 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Who We Are</p>
            <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Engineered for Nepal. Built to last.</h2>
            <p className="mt-6 text-muted-foreground md:text-lg">Since 2011 we've engineered hydropower infrastructure that respects the landscapes it draws energy from — partnering with local communities, government, and global investors.</p>
            <Link to="/about" className="mt-8 inline-flex items-center gap-2 font-semibold text-primary hover:text-accent">Learn more <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Droplets, t: "Run-of-River", d: "No reservoirs, minimal disruption" },
              { icon: Zap, t: "Clean Power", d: "Zero direct carbon emissions" },
              { icon: Mountain, t: "Himalayan Scale", d: "Built for mountain terrain" },
              { icon: Zap, t: "Community First", d: "Local jobs and partnerships" },
            ].map((f) => (
              <div key={f.t} className="rounded-xl border bg-card p-6">
                <f.icon className="h-7 w-7 text-accent" />
                <h3 className="mt-3 font-display text-lg font-bold">{f.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST NEWS */}
      {news && news.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Updates</p>
                <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Latest News</h2>
              </div>
              <Link to="/news" className="hidden text-sm font-semibold text-primary hover:text-accent md:inline-flex">All news →</Link>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {news.map((n) => (
                <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="glow-hover overflow-hidden rounded-xl border bg-card">
                  {n.cover_image_url && <img src={n.cover_image_url} alt={n.title} className="aspect-video w-full object-cover" loading="lazy" />}
                  <div className="p-6">
                    <p className="font-mono text-xs uppercase text-muted-foreground">{n.published_at ? new Date(n.published_at).toLocaleDateString() : ""}</p>
                    <h3 className="mt-2 font-display text-lg font-bold leading-tight">{n.title}</h3>
                    {n.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{n.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="animated-mesh py-24 text-center text-primary-foreground">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Build Nepal's energy future with us.</h2>
          <p className="mt-4 text-primary-foreground/80">Partnership, investment, and media inquiries welcome.</p>
          <Link to="/contact" className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-lg">Get in touch <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
