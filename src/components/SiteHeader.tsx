import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.webp";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/gallery", label: "Gallery" },
  { to: "/documents", label: "Documents" },
  { to: "/news", label: "News" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={`absolute top-0 z-30 w-full ${transparent ? "" : "bg-primary"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 text-primary-foreground">
          <img src={logo} alt="Arun Kabeli Power logo" className="h-11 w-11 rounded-full bg-white/95 p-0.5" width={44} height={44} />
          <span className="hidden font-display text-base font-bold sm:block">Arun Kabeli Power</span>
        </Link>
        <nav className="hidden gap-7 text-sm font-medium text-primary-foreground/90 lg:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="transition hover:text-accent" activeProps={{ className: "text-accent" }} activeOptions={{ exact: n.to === "/" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => setOpen(!open)} className="text-primary-foreground lg:hidden" aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="bg-primary px-6 pb-6 lg:hidden">
          <nav className="flex flex-col gap-3 text-primary-foreground">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 hover:text-accent">{n.label}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
