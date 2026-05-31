import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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

export const aboutLinks = [
  { to: "/about/chairman", label: "Message from Chairman" },
  { to: "/about/board", label: "Board of Directors" },
  { to: "/about/team", label: "Our Team" },
] as const;

export function AboutSubNav() {
  return (
    <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 py-3">
        {aboutLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary [&.active]:bg-primary/10 [&.active]:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AboutDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 transition hover:text-accent"
      >
        About
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border bg-card shadow-lg">
          {aboutLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function usePageContent(sectionKey: string) {
  return useQuery({
    queryKey: ["page-content", sectionKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("page_content")
        .select("content_json")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (!data?.content_json) return {};
      const raw = data.content_json;
      // content_json may come back as a string or parsed object depending on client version
      if (typeof raw === "string") {
        try { return JSON.parse(raw) as Record<string, string>; } catch { return {}; }
      }
      return raw as Record<string, string>;
    },
  });
}

function About() {
  const { data: story } = usePageContent("about.story");
  const { data: mission } = usePageContent("about.mission");

  // Fallback defaults
  const storyTitle = story?.title || "Built on the Arun & Kabeli rivers.";
  const storyBody = story?.body ||
    "Arun Kabeli Power Limited was founded in 2011 with a singular mission: to harness Nepal's abundant Himalayan rivers into reliable, clean electricity for communities and industry.\n\nOver more than a decade, we've engineered hydropower infrastructure that respects the landscapes it draws energy from — partnering with local communities, government bodies, and global investors to deliver power at scale.\n\nEvery megawatt we produce displaces fossil fuel imports and strengthens Nepal's energy independence.";

  const missionTitle = mission?.mission_title || "Mission";
  const missionBody = mission?.mission_body || "Deliver clean, reliable hydropower that strengthens Nepal's energy independence and community wellbeing.";
  const visionTitle = mission?.vision_title || "Vision";
  const visionBody = mission?.vision_body || "A Nepal powered entirely by its own renewable rivers — by 2040.";
  const valuesTitle = mission?.values_title || "Values";
  const valuesBody = mission?.values_body || "Engineering excellence, community partnership, environmental stewardship, transparency.";

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
            <h2 className="mt-3 font-display text-3xl font-bold">{storyTitle}</h2>
          </div>
          <div className="space-y-4 text-muted-foreground md:col-span-2 md:text-lg">
            {storyBody.split("\n").filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3">
          {[
            { t: missionTitle, d: missionBody },
            { t: visionTitle, d: visionBody },
            { t: valuesTitle, d: valuesBody },
          ].map((v) => (
            <div key={v.t} className="rounded-xl border bg-card p-8 shadow-sm">
              <h3 className="font-display text-2xl font-bold text-primary">{v.t}</h3>
              <p className="mt-3 text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA cards to sub-pages */}
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
              <Link
                key={link.to}
                to={link.to}
                className="group rounded-xl border bg-card p-8 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
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
