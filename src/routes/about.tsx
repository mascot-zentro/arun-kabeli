import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const Route = createFileRoute("/about")({
  component: AboutLayout,
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

function AboutLayout() {
  return <Outlet />;
}
