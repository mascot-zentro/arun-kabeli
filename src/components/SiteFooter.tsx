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
  const footerAddress = ci.address || "Kathmandu, Nepal";
  const footerPhone   = ci.phone   || null;
  const footerEmail   = ci.email   || "arunkabeli@gmail.com";
  const footerHours   = ci.hours   || null;

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
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
            {footerAddress && (
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="whitespace-pre-line leading-relaxed">{footerAddress}</span>
              </li>
            )}
            {footerPhone && (
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <a href={`tel:${footerPhone}`} className="hover:text-accent transition-colors">{footerPhone}</a>
              </li>
            )}
            {footerEmail && (
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <a href={`mailto:${footerEmail}`} className="hover:text-accent transition-colors">{footerEmail}</a>
              </li>
            )}
            {footerHours && (
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>
                <span>{footerHours}</span>
              </li>
            )}
          </ul>
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
