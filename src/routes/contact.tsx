import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Arun Kabeli Power" },
      { name: "description", content: "Get in touch with Arun Kabeli Power Limited for partnerships, investment, or media inquiries." },
      { property: "og:title", content: "Contact Arun Kabeli Power" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(200),
  email: z.string().trim().email("Invalid email").max(320),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Message required").max(5000),
});

function Contact() {
  const [busy, setBusy] = useState(false);
  const { data: pageContent } = useQuery({
    queryKey: ["page-content"],
    queryFn: async () => (await supabase.from("page_content").select("*")).data ?? [],
  });
  const ci = (pageContent?.find((s) => s.section_key === "contact.info")?.content_json ?? {}) as Record<string, string>;
  const contactEmail = ci.email || "arunkabeli@gmail.com";
  const contactAddress = ci.address || "Kathmandu, Nepal";
  const contactPhone = ci.phone || null;
  const contactHours = ci.hours || null;
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.from("contact_submissions").insert(parsed.data);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Message sent. We'll be in touch."); e.currentTarget.reset(); }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="animated-mesh pb-16 pt-40 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Get in touch</p>
          <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Contact Us</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">Reach out</h2>
            <p className="mt-2 text-muted-foreground">Partnership, investment, and media inquiries welcome.</p>
            <div className="mt-6 space-y-4">
              <div className="flex gap-3"><Mail className="mt-1 h-5 w-5 text-accent" /><div><div className="font-semibold">Email</div><a href={`mailto:${contactEmail}`} className="text-muted-foreground hover:text-accent">{contactEmail}</a></div></div>
              <div className="flex gap-3"><MapPin className="mt-1 h-5 w-5 text-accent" /><div><div className="font-semibold">Office</div><div className="text-muted-foreground whitespace-pre-line">{contactAddress}</div></div></div>
              {contactPhone && <div className="flex gap-3"><Mail className="mt-1 h-5 w-5 text-accent" /><div><div className="font-semibold">Phone</div><a href={`tel:${contactPhone}`} className="text-muted-foreground hover:text-accent">{contactPhone}</a></div></div>}
              {contactHours && <div className="flex gap-3"><MapPin className="mt-1 h-5 w-5 text-accent" /><div><div className="font-semibold">Hours</div><div className="text-muted-foreground">{contactHours}</div></div></div>}
            </div>
            <iframe src="https://www.google.com/maps?q=Kathmandu,Nepal&output=embed" className="mt-6 aspect-video w-full rounded-lg border" title="Office location" loading="lazy" />
          </div>
          <form onSubmit={onSubmit} className="rounded-xl border bg-card p-8 shadow-sm">
            <div className="space-y-4">
              <div><label className="text-sm font-medium">Name</label><input name="name" required maxLength={200} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium">Email</label><input name="email" type="email" required maxLength={320} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium">Subject</label><input name="subject" maxLength={200} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium">Message</label><textarea name="message" required maxLength={5000} rows={5} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
              <button disabled={busy} className="w-full rounded-md bg-accent px-5 py-3 font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-50">{busy ? "Sending..." : "Send message"}</button>
            </div>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
