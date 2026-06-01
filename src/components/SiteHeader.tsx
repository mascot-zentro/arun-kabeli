import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LogIn, LayoutDashboard, Sun, Moon, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.webp";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { AboutDropdown, aboutLinks } from "@/routes/about";

const nav = [
  { to: "/projects", label: "Projects" },
  { to: "/subsidiaries", label: "Subsidiaries" },
  { to: "/gallery", label: "Gallery" },
  { to: "/documents", label: "Documents" },
  { to: "/news", label: "News" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const adminLink = user && isAdmin
    ? { to: "/admin/dashboard", label: "Admin", icon: LayoutDashboard }
    : { to: "/admin/login", label: "Login", icon: LogIn };

  return (
    <header className={`absolute top-0 z-30 w-full ${transparent ? "" : "bg-primary"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 text-primary-foreground">
          <img src={logo} alt="Arun Kabeli Power logo" className="h-11 w-11 rounded-full bg-white/95 p-0.5" width={44} height={44} />
          <span className="hidden font-display text-base font-bold sm:block">Arun Kabeli Power</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-primary-foreground/90 lg:flex">
          <Link to="/" className="transition hover:text-accent" activeProps={{ className: "text-accent" }} activeOptions={{ exact: true }}>
            Home
          </Link>
          <AboutDropdown />
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="transition hover:text-accent" activeProps={{ className: "text-accent" }}>
              {n.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="rounded-md border border-primary-foreground/30 p-1.5 text-primary-foreground transition hover:border-accent hover:text-accent"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to={adminLink.to}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary-foreground/30 px-3 py-1.5 text-primary-foreground transition hover:border-accent hover:text-accent"
            activeProps={{ className: "border-accent text-accent" }}
          >
            <adminLink.icon className="h-4 w-4" />
            {adminLink.label}
          </Link>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="rounded-md border border-primary-foreground/30 p-1.5 text-primary-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={() => setOpen(!open)} className="text-primary-foreground" aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="bg-primary px-6 pb-6 lg:hidden">
          <nav className="flex flex-col gap-3 text-primary-foreground">
            <Link to="/" onClick={() => setOpen(false)} className="py-2 hover:text-accent">Home</Link>

            {/* About — link + accordion for sub-pages */}
            <div>
              <div className="flex items-center justify-between">
                <Link
                  to="/about"
                  onClick={() => { setOpen(false); setMobileAboutOpen(false); }}
                  className="py-2 hover:text-accent"
                >
                  About
                </Link>
                <button
                  onClick={() => setMobileAboutOpen((v) => !v)}
                  aria-label="Show about sub-pages"
                  className="p-2 hover:text-accent"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileAboutOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              {mobileAboutOpen && (
                <div className="ml-4 flex flex-col gap-1 pb-1">
                  {aboutLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => { setOpen(false); setMobileAboutOpen(false); }}
                      className="py-2 text-sm text-primary-foreground/80 hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 hover:text-accent">{n.label}</Link>
            ))}
            <Link to={adminLink.to} onClick={() => setOpen(false)} className="inline-flex items-center gap-2 py-2 hover:text-accent">
              <adminLink.icon className="h-4 w-4" />{adminLink.label}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
