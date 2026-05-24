import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FolderKanban, FileText, Image, Newspaper, Inbox } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: counts } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [p, d, ph, n, c] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("photos").select("id", { count: "exact", head: true }),
        supabase.from("news").select("id", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("is_read", false),
      ]);
      return { projects: p.count ?? 0, documents: d.count ?? 0, photos: ph.count ?? 0, news: n.count ?? 0, unread: c.count ?? 0 };
    },
  });
  const { data: recent } = useQuery({
    queryKey: ["recent-contacts"],
    queryFn: async () => (await supabase.from("contact_submissions").select("*").order("submitted_at", { ascending: false }).limit(5)).data ?? [],
  });

  const cards = [
    { to: "/admin/projects", label: "Projects", count: counts?.projects, icon: FolderKanban },
    { to: "/admin/documents", label: "Documents", count: counts?.documents, icon: FileText },
    { to: "/admin/gallery", label: "Photos", count: counts?.photos, icon: Image },
    { to: "/admin/news", label: "News", count: counts?.news, icon: Newspaper },
    { to: "/admin/contacts", label: "Unread", count: counts?.unread, icon: Inbox },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Welcome back.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="rounded-xl border bg-card p-5 transition hover:border-accent">
            <c.icon className="h-5 w-5 text-accent" />
            <div className="mt-3 font-mono text-3xl font-bold">{c.count ?? "—"}</div>
            <div className="mt-1 text-sm text-muted-foreground">{c.label}</div>
          </Link>
        ))}
      </div>
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold">Recent Contact Submissions</h2>
        <div className="mt-4 overflow-hidden rounded-xl border bg-card">
          {recent && recent.length > 0 ? recent.map((r) => (
            <div key={r.id} className="border-b p-4 last:border-0">
              <div className="flex justify-between"><span className="font-semibold">{r.name}</span><span className="font-mono text-xs text-muted-foreground">{new Date(r.submitted_at!).toLocaleDateString()}</span></div>
              <div className="text-sm text-muted-foreground">{r.email} · {r.subject ?? "—"}</div>
              <p className="mt-1 line-clamp-2 text-sm">{r.message}</p>
            </div>
          )) : <p className="p-6 text-center text-sm text-muted-foreground">No submissions yet.</p>}
        </div>
      </div>
    </div>
  );
}
