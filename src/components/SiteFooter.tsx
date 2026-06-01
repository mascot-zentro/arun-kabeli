import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.webp";

export function SiteFooter() {
  const { data: pageContent } = useQuery({
    queryKey: ["page-content"],
    queryFn: async () => (await supabase.from("page_content").select("*")).data ?? [],
    staleTime: 5 * 60 * 1000, // 5 min — footer doesn't need real-time updates
  });
  const ci = (pageContent?.find((s) => s.section_key === "contact.info")?.content_json ?? {}) as Record<string, string>;
  const footerEmail = ci.email || "arunkabeli@gmail.com";
  const footerAddress = ci.address || "Kathmandu, Nepal";

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Arun Kabeli Power logo" className="h-12 w-12 rounded-full bg-white/95 p-0.5" width={48} height={48} />
            <span className="font-display text-lg font-bold">Arun Kabeli Power</span>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/70">Sustainable hydropower for Nepal's future. Est. 2011.</p>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-accent">About</Link></li>
            <li><Link to="/projects" className="hover:text-accent">Projects</Link></li>
            <li><Link to="/gallery" className="hover:text-accent">Gallery</Link></li>
            <li><Link to="/news" className="hover:text-accent">News</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Resources</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/documents" className="hover:text-accent">Documents</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
            <li><Link to="/admin/login" className="hover:text-accent">Admin</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Contact</h4>
          <p className="mt-4 whitespace-pre-line text-sm text-primary-foreground/70">{footerAddress}<br/><a href={`mailto:${footerEmail}`} className="hover:text-accent">{footerEmail}</a></p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-5 text-center text-xs text-primary-foreground/60">
        <p>© {new Date().getFullYear()} Arun Kabeli Power Limited. All rights reserved.</p>
        <p className="mt-1">
          Developed by{" "}
          <a
            href="https://www.shreeyushdhungana.com.np/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Shreeyush Dhungana
          </a>
        </p>
      </div>
    </footer>
  );
}
