import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AboutSubNav } from "./about";
import { ChevronDown } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="animated-mesh pb-20 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">About Us</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold md:text-6xl">
            Engineering Nepal's clean energy transition.
          </h1>
        </div>
      </section>
      <AboutSubNav />
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
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Explore</p>
          <h2 className="mt-2 font-display text-4xl font-bold">Meet the people behind our work.</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { to: "/about/chairman", label: "Message from Chairman", desc: "A word from our Chairman on vision and direction." },
              { to: "/about/board", label: "Board of Directors", desc: "The directors guiding our strategic decisions." },
              { to: "/about/team", label: "Our Team", desc: "The full team driving our hydropower mission." },
            ].map((link) => (
              <Link key={link.to} to={link.to} className="group rounded-xl border bg-card p-8 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                <h3 className="font-display text-xl font-bold group-hover:text-primary">{link.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{link.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View <ChevronDown className="-rotate-90 h-4 w-4" />
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
