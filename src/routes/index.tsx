import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRight, Zap, Droplets, Mountain, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { AkplTicker } from "@/components/AkplTicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    queryFn: async () => (await supabase.from("photos").select("id,url,alt_text,caption").order("uploaded_at", { ascending: false }).limit(8)).data ?? [],
  });
  const { data: projects } = useQuery({
    queryKey: ["projects-featured"],
    queryFn: async () => (await supabase.from("projects").select("*").eq("is_published", true).order("sort_order", { ascending: true }).limit(3)).data ?? [],
  });
  const { data: news } = useQuery({
    queryKey: ["news-latest"],
    queryFn: async () => (await supabase.from("news").select("*").eq("is_published", true).order("published_at", { ascending: false }).limit(3)).data ?? [],
  });
  const { data: pageContent } = useQuery({
    queryKey: ["page-content"],
    queryFn: async () => (await supabase.from("page_content").select("*")).data ?? [],
  });

  const heroC  = (pageContent?.find((s) => s.section_key === "home.hero")?.content_json  ?? {}) as Record<string, string>;
  const introC = (pageContent?.find((s) => s.section_key === "home.intro")?.content_json ?? {}) as Record<string, string>;
  const statsC   = (pageContent?.find((s) => s.section_key === "home.stats")?.content_json   ?? {}) as Record<string, string>;
  const capitalC = (pageContent?.find((s) => s.section_key === "home.capital")?.content_json ?? {}) as Record<string, string>;

  const capitals = [
    { label: "Authorized Capital", value: capitalC.authorized_value || "10,00,00,000", suffix: capitalC.authorized_suffix || "NPR" },
    { label: "Paid Up Capital",    value: capitalC.paidup_value     || "7,50,00,000",  suffix: capitalC.paidup_suffix     || "NPR" },
    { label: "Issued Capital",     value: capitalC.issued_value     || "7,50,00,000",  suffix: capitalC.issued_suffix     || "NPR" },
  ];

  // Popup docs
  const { data: popupDocs } = useQuery({
    queryKey: ["popup-docs"],
    queryFn: async () =>
      (await supabase.from("documents").select("*").eq("is_public", true).eq("show_as_popup", true).order("popup_sort_order")).data ?? [],
  });
  const [popupIdx, setPopupIdx] = useState<number | null>(null);
  const currentPopup = popupIdx !== null && popupDocs ? popupDocs[popupIdx] : null;
  useEffect(() => {
    if (!popupDocs || popupDocs.length === 0) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("akpl-doc-popup-seen")) return;
    setPopupIdx(0);
    sessionStorage.setItem("akpl-doc-popup-seen", "1");
  }, [popupDocs?.length]);

  const stats = [
    { k: statsC.stat1_value || "55",   suffix: statsC.stat1_suffix || "MW",  v: statsC.stat1_label || "Installed Capacity" },
    { k: statsC.stat2_value || "3",    suffix: statsC.stat2_suffix || "+",   v: statsC.stat2_label || "Active Projects" },
    { k: statsC.stat3_value || "14",   suffix: statsC.stat3_suffix || "yrs", v: statsC.stat3_label || "In Operation" },
    { k: statsC.stat4_value || "100k", suffix: statsC.stat4_suffix || "+",   v: statsC.stat4_label || "Households Served" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader transparent />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <HeroSection photos={heroPhotos ?? []} heroC={heroC} stats={stats} />

      {/* ── WHO WE ARE ───────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_400px] lg:items-start">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{introC.eyebrow || "Who We Are"}</p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
                {introC.title || "Welcome to Arun Kabeli Power Limited"}
              </h2>
              <IntroBody text={introC.body || "Since 2011 we've engineered hydropower infrastructure that respects the landscapes it draws energy from — partnering with local communities, government, and global investors."} />
              <Link
                to={(introC.cta_link as any) || "/about"}
                className="mt-6 inline-flex items-center gap-2 font-semibold text-primary hover:text-accent"
              >
                {introC.cta_label || "Learn more"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {[
                { icon: Droplets, t: "Run-of-River", d: "No reservoirs, minimal disruption" },
                { icon: Zap,      t: "Clean Power",  d: "Zero direct carbon emissions" },
                { icon: Mountain, t: "Himalayan Scale", d: "Built for mountain terrain" },
                { icon: Zap,      t: "Community First", d: "Local jobs and partnerships" },
              ].map((f) => (
                <div key={f.t} className="rounded-xl border bg-card p-5">
                  <f.icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-2 font-display text-base font-bold">{f.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROJECTS ────────────────────────────────────────────── */}
      <section className="border-t bg-secondary/30 py-24">
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
                  {p.cover_photo_url
                    ? <img src={p.cover_photo_url} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                    : <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-mesh)" }}><Mountain className="h-16 w-16 text-accent/60" /></div>}
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

      {/* ── CAPITAL ──────────────────────────────────────────────────────── */}
      <CapitalSection capitals={capitals} />

      {/* ── STOCK TICKER ─────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Investor Relations</p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">AKPL on the Nepal Stock Exchange</h2>
              <p className="mt-4 max-w-lg text-muted-foreground leading-relaxed">
                Arun Kabeli Power Limited (AKPL) is publicly listed on the Nepal Stock Exchange under the Hydro Power sector. Live price data is sourced directly from NEPSE and refreshed every 60 seconds.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="https://www.nepalstock.com/company/detail/975" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary transition">
                  View on NEPSE ↗
                </a>
                <a href="https://sharehubnepal.com/company/AKPL" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary transition">
                  ShareHub Analysis ↗
                </a>
              </div>
            </div>
            <AkplTicker />
          </div>
        </div>
      </section>

      {/* ── LATEST NEWS ──────────────────────────────────────────────────── */}
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

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="animated-mesh py-24 text-center text-primary-foreground">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Build Nepal's energy future with us.</h2>
          <p className="mt-4 text-primary-foreground/80">Partnership, investment, and media inquiries welcome.</p>
          <Link to="/contact" className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-lg">
            Get in touch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── DOCUMENT POPUP ───────────────────────────────────────────────── */}
      <Dialog open={currentPopup !== null} onOpenChange={(v) => !v && setPopupIdx(null)}>
        <DialogContent className="flex h-[85vh] max-w-5xl flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 pr-8">
              <span className="truncate">{currentPopup?.title}</span>
              <div className="flex items-center gap-2">
                {currentPopup && (
                  <a href={currentPopup.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-md border px-2 py-1 text-xs font-normal hover:bg-secondary">Open in new tab</a>
                )}
                {popupDocs && popupDocs.length > 1 && (
                  <span className="font-mono text-xs text-muted-foreground">{(popupIdx ?? 0) + 1} / {popupDocs.length}</span>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          {currentPopup && (
            <object data={currentPopup.file_url} type="application/pdf" className="min-h-0 flex-1 rounded-md border">
              <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(currentPopup.file_url)}&embedded=true`} className="h-full w-full rounded-md border" title={currentPopup.title} />
            </object>
          )}
          {popupDocs && popupDocs.length > 1 && (
            <div className="flex items-center justify-between border-t pt-3">
              <button onClick={() => setPopupIdx((i) => (i !== null && i > 0 ? i - 1 : i))} disabled={popupIdx === 0} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={() => { if (popupIdx === null) return; if (popupIdx < popupDocs.length - 1) setPopupIdx(popupIdx + 1); else setPopupIdx(null); }}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                {popupIdx !== null && popupIdx < popupDocs.length - 1 ? (<>Next <ChevronRight className="h-4 w-4" /></>) : "Done"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}

// ── Hero Section ─────────────────────────────────────────────────────────────

type Photo   = { id: string; url: string; alt_text: string | null; caption: string | null };
type Stat    = { k: string; suffix: string; v: string };
type Capital = { label: string; value: string; suffix: string };

function HeroSection({ photos, heroC, stats }: { photos: Photo[]; heroC: Record<string, string>; stats: Stat[] }) {
  const [idx, setIdx]       = useState(0);
  const [paused, setPaused] = useState(false);
  const hasPhotos = photos.length > 0;

  const next = useCallback(() => setIdx((i) => (i + 1) % Math.max(photos.length, 1)), [photos.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + Math.max(photos.length, 1)) % Math.max(photos.length, 1)), [photos.length]);

  useEffect(() => {
    if (photos.length < 2 || paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [photos.length, paused, next]);

  return (
    <section className="relative min-h-screen overflow-hidden">

      {/* ── Background: full-bleed slider or mesh fallback ── */}
      <div className="absolute inset-0 h-full">
        {hasPhotos ? (
          <>
            {photos.map((p, i) => (
              <img
                key={p.id}
                src={p.url}
                alt={p.alt_text ?? ""}
                loading={i === 0 ? "eager" : "lazy"}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === idx ? "opacity-100" : "opacity-0"}`}
              />
            ))}
            {/* Gradient overlay — dark at top (nav) + left (text), lighter on right */}
            <div className="absolute inset-0 h-full bg-gradient-to-r from-primary/90 via-primary/70 to-primary/30" />
            <div className="absolute inset-0 h-full bg-gradient-to-b from-primary/40 via-transparent to-primary/60" />
          </>
        ) : (
          <div className="absolute inset-0 animated-mesh" />
        )}
      </div>

      {/* ── Dot grid texture overlay ── */}
      <div className="absolute inset-0 h-full opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      {/* ── Hanging light bulb — top-right corner ── */}
      <div className="absolute left-8 top-0 z-20 hidden lg:flex lg:flex-col lg:items-center">
        <LightBulb />
      </div>

      {/* ── Content ── */}
      <div className="relative flex min-h-screen flex-col">

        {/* Main content — vertically centered */}
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-7xl px-6 py-40">
            <div className="max-w-2xl">

              {/* Eyebrow */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
                  {heroC.eyebrow || "Est. 2011 · Nepal"}
                </p>
              </div>

              {/* Headline */}
              <h1 className="font-display text-5xl font-bold leading-[1.05] text-white md:text-6xl lg:text-7xl">
                {heroC.title || "Powering Nepal with Himalayan rivers."}
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
                {heroC.subtitle || "Sustainable run-of-river hydropower delivering clean, reliable electricity to communities and industry across Nepal."}
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to={(heroC.cta_link as any) || "/projects"}
                  className="group inline-flex items-center gap-2 rounded-md bg-accent px-7 py-3.5 font-semibold text-accent-foreground shadow-lg transition hover:opacity-90"
                >
                  {heroC.cta_label || "Explore Projects"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Partner With Us
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="relative border-t border-white/10 bg-primary/60 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 gap-px md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={s.v} className={`py-6 text-center ${i !== 0 ? "border-l border-white/10" : ""}`}>
                  <div className="font-mono text-3xl font-bold text-white md:text-4xl">
                    {s.k}<span className="text-accent">{s.suffix}</span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wider text-white/60">{s.v}</p>
                </div>
              ))}
            </div>
            {/* Live stock ticker row */}
            <div className="flex items-center justify-between border-t border-white/10 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Market</p>
              <AkplTicker compact />
            </div>
          </div>
        </div>


        {/* ── Slider controls — bottom right ── */}
        {hasPhotos && photos.length > 1 && (
          <div className="absolute bottom-24 right-6 flex items-center gap-2 md:bottom-28 md:right-10">
            {/* Dot indicators */}
            <div className="mr-2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`rounded-full transition-all ${i === idx ? "w-6 h-2 bg-accent" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
            {/* Prev / Pause / Next */}
            <button onClick={prev} aria-label="Previous" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPaused((v) => !v)} aria-label={paused ? "Play" : "Pause"} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20">
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
            <button onClick={next} aria-label="Next" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Caption */}
        {hasPhotos && photos[idx]?.caption && (
          <div className="absolute bottom-[5.5rem] left-6 md:bottom-24 md:left-10">
            <p className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/60 backdrop-blur-sm">
              {photos[idx].caption}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// ── Capital Section ──────────────────────────────────────────────────────────
function CapitalSection({ capitals }: { capitals: Capital[] }) {
  const icons = ["🏦", "💰", "📈"];
  const colors = [
    "from-accent/20 to-accent/5 border-accent/20",
    "from-primary/20 to-primary/5 border-primary/20",
    "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
  ];
  const textColors = ["text-accent", "text-primary", "text-emerald-600 dark:text-emerald-400"];

  return (
    <section className="relative overflow-hidden border-y bg-secondary/20 py-16">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }} />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Financials</p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Capital Structure</h2>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground">Authorised, paid-up, and issued capital as registered with the Securities Board of Nepal.</p>
        </div>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          {capitals.map((cap, i) => (
            <div key={cap.label} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-sm ${colors[i]}`}>
              {/* Icon */}
              <div className="mb-4 text-3xl">{icons[i]}</div>

              {/* Label */}
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{cap.label}</p>

              {/* Value */}
              <div className={`mt-2 font-mono text-3xl font-bold md:text-4xl ${textColors[i]}`}>
                <RollingNumber value={cap.value} />
              </div>
              <p className="mt-1 font-mono text-sm font-medium text-muted-foreground">{cap.suffix}</p>

              {/* Decorative circle */}
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 ${i === 0 ? "bg-accent" : i === 1 ? "bg-primary" : "bg-emerald-500"}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Interactive Light Bulb ───────────────────────────────────────────────────
function LightBulb() {
  const [on, setOn] = useState(true);
  const [hover, setHover] = useState(false);

  // Auto-toggle every 3 seconds
  useEffect(() => {
    const t = setInterval(() => setOn((v) => !v), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <button
      onClick={() => setOn((v) => !v)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={on ? "Turn light off" : "Turn light on"}
      className="group relative flex flex-col items-center focus:outline-none select-none"
      style={{
        filter: on ? `drop-shadow(0 0 ${hover ? "48px" : "28px"} #FFD700) drop-shadow(0 0 ${hover ? "80px" : "48px"} rgba(255,200,0,0.35))` : "none",
        transition: "filter 0.4s ease",
      }}
    >
      {/* Curvy hanging rope */}
      <svg width="60" height="90" viewBox="0 0 60 90" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: "-6px" }}
      >
        {/* Rope shadow/depth */}
        <path
          d="M30 2 C18 20, 42 40, 30 60 C22 72, 35 80, 30 88"
          stroke={on ? "rgba(100,70,20,0.5)" : "rgba(60,60,60,0.4)"}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          style={{ transition: "stroke 0.4s" }}
        />
        {/* Rope main body */}
        <path
          d="M30 2 C18 20, 42 40, 30 60 C22 72, 35 80, 30 88"
          stroke={on ? "url(#ropeGradOn)" : "url(#ropeGradOff)"}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          style={{ transition: "stroke 0.4s" }}
        />
        {/* Rope highlight (left edge shine) */}
        <path
          d="M28 2 C16 20, 40 40, 28 60 C20 72, 33 80, 28 88"
          stroke={on ? "rgba(255,220,120,0.35)" : "rgba(200,200,200,0.2)"}
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          style={{ transition: "stroke 0.4s" }}
        />
        {/* Rope texture dashes */}
        {[10, 22, 34, 48, 62, 74].map((t, i) => {
          const x = 30 + (i % 2 === 0 ? -6 : 6);
          const y = t;
          return (
            <line key={i}
              x1={x - 3} y1={y}
              x2={x + 3} y2={y + 4}
              stroke={on ? "rgba(140,90,10,0.5)" : "rgba(80,80,80,0.35)"}
              strokeWidth="1"
              strokeLinecap="round"
              style={{ transition: "stroke 0.4s" }}
            />
          );
        })}
        <defs>
          <linearGradient id="ropeGradOn" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#8B5E1A" />
            <stop offset="35%"  stopColor="#D4A017" />
            <stop offset="65%"  stopColor="#F5C842" />
            <stop offset="100%" stopColor="#8B5E1A" />
          </linearGradient>
          <linearGradient id="ropeGradOff" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#3A3A3A" />
            <stop offset="35%"  stopColor="#6A6A6A" />
            <stop offset="65%"  stopColor="#8A8A8A" />
            <stop offset="100%" stopColor="#3A3A3A" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bulb SVG — viewBox sized for the realistic shape */}
      <svg width="110" height="138" viewBox="0 0 96 120" fill="none" xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-200 group-hover:scale-105"
      >
        <defs>
          {/* ON globe — warm yellow */}
          <radialGradient id="globeOn" cx="38%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#FFFDE0" />
            <stop offset="30%"  stopColor="#FFE566" />
            <stop offset="70%"  stopColor="#FFAE00" />
            <stop offset="100%" stopColor="#CC7A00" stopOpacity="0.9" />
          </radialGradient>
          {/* OFF globe — cool white/grey */}
          <radialGradient id="globeOff" cx="38%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#F0F0F0" />
            <stop offset="40%"  stopColor="#D0D0D8" />
            <stop offset="100%" stopColor="#8890A0" stopOpacity="0.9" />
          </radialGradient>
          {/* Base metal gradient */}
          <linearGradient id="baseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#6B7280" />
            <stop offset="20%"  stopColor="#9CA3AF" />
            <stop offset="50%"  stopColor="#D1D5DB" />
            <stop offset="80%"  stopColor="#9CA3AF" />
            <stop offset="100%" stopColor="#6B7280" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="filamentGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Outer ambient glow (on only) ── */}
        {on && (
          <ellipse cx="48" cy="44" rx={hover ? "44" : "38"} ry={hover ? "44" : "38"}
            fill="#FFD700" fillOpacity={hover ? "0.18" : "0.10"}
            style={{ transition: "all 0.3s ease" }}
          />
        )}

        {/* ── Globe body ── */}
        {/* Shadow beneath globe */}
        <ellipse cx="48" cy="72" rx="22" ry="4" fill="rgba(0,0,0,0.18)" />
        {/* Main globe circle */}
        <circle cx="48" cy="44" r="32"
          fill={on ? "url(#globeOn)" : "url(#globeOff)"}
          style={{ transition: "fill 0.4s ease" }}
        />
        {/* Globe rim (dark edge) */}
        <circle cx="48" cy="44" r="32"
          fill="none" stroke={on ? "rgba(160,80,0,0.3)" : "rgba(80,90,110,0.3)"} strokeWidth="1"
        />

        {/* ── Specular highlights ── */}
        {/* Main large highlight */}
        <ellipse cx="36" cy="28" rx="10" ry="8"
          fill="white" fillOpacity={on ? "0.55" : "0.45"}
          style={{ transition: "opacity 0.4s" }}
        />
        {/* Small secondary highlight */}
        <ellipse cx="54" cy="22" rx="4" ry="3"
          fill="white" fillOpacity={on ? "0.35" : "0.25"}
        />

        {/* ── Filament supports (vertical wires inside globe) ── */}
        <line x1="40" y1="50" x2="40" y2="70" stroke={on ? "#C87400" : "#8890A0"} strokeWidth="1" opacity="0.7"/>
        <line x1="56" y1="50" x2="56" y2="70" stroke={on ? "#C87400" : "#8890A0"} strokeWidth="1" opacity="0.7"/>

        {/* ── Filament (the W-shaped coil) ── */}
        <path
          d="M38 58 Q40 50 43 56 Q46 62 48 53 Q50 44 53 52 Q56 60 58 52"
          stroke={on ? "#FFF5A0" : "#A0A8B8"}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          filter={on ? "url(#filamentGlow)" : "none"}
          style={{ transition: "stroke 0.4s, filter 0.4s" }}
        />
        {/* Filament support base bar */}
        <line x1="38" y1="68" x2="58" y2="68"
          stroke={on ? "#C87400" : "#8890A0"} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"
        />

        {/* ── Base / screw cap — 3 stepped rings ── */}
        {/* Ring 1 (widest) */}
        <rect x="30" y="72" width="36" height="9" rx="2" fill="url(#baseGrad)" />
        <rect x="30" y="72" width="36" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
        {/* Ring 2 */}
        <rect x="33" y="81" width="30" height="8" rx="2" fill="url(#baseGrad)" />
        <rect x="33" y="81" width="30" height="2" rx="1" fill="rgba(255,255,255,0.12)" />
        {/* Ring 3 (narrowest) */}
        <rect x="36" y="89" width="24" height="8" rx="2" fill="url(#baseGrad)" />
        <rect x="36" y="89" width="24" height="2" rx="1" fill="rgba(255,255,255,0.10)" />
        {/* Bottom tip */}
        <rect x="42" y="97" width="12" height="5" rx="2.5" fill="#5A6270" />

        {/* ── Rays when ON ── */}
        {on && [0,40,80,120,160,200,240,280,320].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const r1 = 35, r2 = 43 + (i % 2) * 4;
          return (
            <line key={deg}
              x1={48 + r1 * Math.cos(rad)} y1={44 + r1 * Math.sin(rad)}
              x2={48 + r2 * Math.cos(rad)} y2={44 + r2 * Math.sin(rad)}
              stroke="#FFD700" strokeWidth={i % 2 === 0 ? "2.5" : "1.5"}
              strokeLinecap="round"
              style={{ animation: `ray-pulse 1.8s ease-in-out ${i * 0.2}s infinite alternate` }}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      <span
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-3 py-0.5 text-[10px] text-white/80 backdrop-blur-sm pointer-events-none"
        style={{ opacity: hover ? 1 : 0, transition: "opacity 0.2s" }}
      >
        {on ? "Turn off" : "Turn on"}
      </span>
    </button>
  );
}

function RollingNumber({ value }: { value: string }) {
  const [displayed, setDisplayed] = useState("0");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Small delay so the animation fires after mount (visible on first load)
    const delay = setTimeout(() => {
      setAnimating(true);
      // Extract numeric portion and animate digit-by-digit
      const target = value;
      const chars = target.split("");
      let frame = 0;
      const totalFrames = 40;
      const timer = setInterval(() => {
        frame++;
        if (frame >= totalFrames) {
          setDisplayed(target);
          setAnimating(false);
          clearInterval(timer);
          return;
        }
        // Build scrambled version that converges char by char
        const progress = frame / totalFrames;
        const revealed = Math.floor(progress * chars.length);
        const scrambled = chars.map((ch, ci) => {
          if (ci < revealed) return ch;
          if (/[0-9]/.test(ch)) return String(Math.floor(Math.random() * 10));
          return ch;
        }).join("");
        setDisplayed(scrambled);
      }, 30);
      return () => clearInterval(timer);
    }, 300);
    return () => clearTimeout(delay);
  }, [value]);

  return (
    <span className={`inline-block transition-opacity duration-300 ${animating ? "opacity-80" : "opacity-100"}`}>
      {displayed}
    </span>
  );
}

function IntroBody({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 320;
  const isLong = text.length > LIMIT;
  const displayed = isLong && !expanded ? text.slice(0, LIMIT).trimEnd() + "…" : text;
  return (
    <div className="mt-4">
      <p className="text-muted-foreground leading-relaxed md:text-lg">{displayed}</p>
      {isLong && (
        <button onClick={() => setExpanded((v) => !v)} className="mt-2 text-sm font-semibold text-primary hover:text-accent">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
