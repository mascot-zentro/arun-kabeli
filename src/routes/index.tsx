import { createFileRoute } from "@tanstack/react-router";
import logo from "@/assets/logo.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arun Kabeli Power Limited — Hydropower in Nepal" },
      { name: "description", content: "Arun Kabeli Power Limited develops sustainable run-of-river hydropower projects in Nepal, delivering clean renewable energy since 2011." },
      { name: "keywords", content: "Arun Kabeli Power, hydropower Nepal, renewable energy, run-of-river, clean energy" },
      { property: "og:title", content: "Arun Kabeli Power Limited — Hydropower in Nepal" },
      { property: "og:description", content: "Sustainable hydropower projects powering Nepal's future since 2011." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Arun Kabeli Power Limited",
        foundingDate: "2011",
        url: "https://iamjoj.com",
        logo: "https://iamjoj.com/logo.webp",
        description: "Hydropower developer in Nepal focused on sustainable run-of-river projects.",
        address: { "@type": "PostalAddress", addressCountry: "NP" },
      }),
    }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute top-0 z-20 w-full">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-3 text-primary-foreground">
            <img src={logo} alt="Arun Kabeli Power Limited logo" className="h-12 w-12 rounded-full bg-white/95 p-1" width={48} height={48} />
            <span className="hidden font-display text-lg font-semibold sm:block">Arun Kabeli Power</span>
          </a>
          <nav aria-label="Primary" className="hidden gap-8 text-sm text-primary-foreground/90 md:flex">
            <a href="#about" className="hover:text-accent">About</a>
            <a href="#projects" className="hover:text-accent">Projects</a>
            <a href="#sustainability" className="hover:text-accent">Sustainability</a>
            <a href="#contact" className="hover:text-accent">Contact</a>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[92vh] items-center overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-32 md:grid-cols-2 md:items-center">
          <div className="text-primary-foreground">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-accent">Est. 2011 · Nepal</p>
            <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">Powering Nepal with the rivers that built it.</h1>
            <p className="mt-6 max-w-lg text-lg text-primary-foreground/80">Arun Kabeli Power Limited develops run-of-river hydropower that turns Himalayan currents into reliable, renewable electricity for communities and industry.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#projects" className="rounded-md bg-accent px-6 py-3 font-medium text-accent-foreground shadow-lg transition hover:opacity-90">Explore Projects</a>
              <a href="#contact" className="rounded-md border border-primary-foreground/30 px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary-foreground/10">Contact Us</a>
            </div>
          </div>
          <div className="flex justify-center">
            <img src={logo} alt="Arun Kabeli Power Limited corporate emblem" className="h-64 w-64 rounded-full bg-white/95 p-6 shadow-2xl md:h-80 md:w-80" width={320} height={320} />
          </div>
        </div>
      </section>

      <section id="about" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">About</p>
              <h2 className="mt-3 font-display text-4xl font-bold">Built on the Arun &amp; Kabeli rivers.</h2>
            </div>
            <p className="text-muted-foreground md:col-span-2 md:text-lg">For over a decade, we have engineered hydropower infrastructure that respects the landscapes it draws energy from. Our team partners with local communities, government, and global investors to deliver clean power at scale.</p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { k: "25+ MW", v: "Installed capacity across projects" },
              { k: "100k+", v: "Households powered annually" },
              { k: "2011", v: "Year established in Nepal" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border bg-card p-8 shadow-sm">
                <div className="font-display text-4xl font-bold text-primary">{s.k}</div>
                <p className="mt-2 text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="bg-secondary/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Projects</p>
          <h2 className="mt-3 font-display text-4xl font-bold">Run-of-river hydropower portfolio.</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { n: "Kabeli B1", c: "25 MW", l: "Panchthar District", s: "Operational" },
              { n: "Upper Arun", c: "12 MW", l: "Sankhuwasabha", s: "Construction" },
              { n: "Lower Arun", c: "18 MW", l: "Bhojpur", s: "Planning" },
            ].map((p) => (
              <article key={p.n} className="group rounded-xl border bg-card p-8 transition hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold">{p.n}</h3>
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground">{p.s}</span>
                </div>
                <dl className="mt-6 space-y-2 text-sm">
                  <div className="flex justify-between border-b py-2"><dt className="text-muted-foreground">Capacity</dt><dd className="font-medium">{p.c}</dd></div>
                  <div className="flex justify-between py-2"><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{p.l}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sustainability" className="py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Sustainability</p>
            <h2 className="mt-3 font-display text-4xl font-bold">Clean energy with a low footprint.</h2>
            <p className="mt-6 text-muted-foreground md:text-lg">Run-of-river technology means no large reservoirs, minimal habitat disruption, and continuous power generation. Every megawatt we produce displaces fossil fuel imports and strengthens Nepal's energy independence.</p>
          </div>
          <ul className="space-y-4">
            {["Zero direct carbon emissions","Community-first land partnerships","ISO-aligned safety standards","Local employment &amp; training"].map((i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                <span dangerouslySetInnerHTML={{ __html: i }} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" className="py-24" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-4xl px-6 text-center text-primary-foreground">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Let's build Nepal's energy future.</h2>
          <p className="mt-4 text-primary-foreground/80">Partnership, investment, and media inquiries welcome.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <a href="mailto:info@iamjoj.com" className="rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 p-6 transition hover:bg-primary-foreground/10">
              <div className="text-sm uppercase tracking-wider text-accent">Email</div>
              <div className="mt-2 font-medium">info@iamjoj.com</div>
            </a>
            <div className="rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 p-6">
              <div className="text-sm uppercase tracking-wider text-accent">Office</div>
              <div className="mt-2 font-medium">Kathmandu, Nepal</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-card py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Arun Kabeli Power Limited. All rights reserved.</p>
          <p>Hydropower · Nepal · Since 2011</p>
        </div>
      </footer>
    </div>
  );
}
