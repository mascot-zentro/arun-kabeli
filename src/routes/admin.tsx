import { createFileRoute, Outlet, Link, useRouter, useRouterState, redirect } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, FileText, FolderKanban, Image, Users, Newspaper, FileEdit, Inbox, LogOut, KeyRound, Building2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/documents", label: "Documents", icon: FileText },
  { to: "/admin/gallery", label: "Gallery", icon: Image },
  { to: "/admin/team", label: "Team", icon: Users },
  { to: "/admin/subsidiaries", label: "Subsidiaries", icon: Building2 },
  { to: "/admin/news", label: "News", icon: Newspaper },
  { to: "/admin/pages", label: "Page Content", icon: FileEdit },
  { to: "/admin/contacts", label: "Contacts", icon: Inbox },
  { to: "/admin/password", label: "Change Password", icon: KeyRound },
];

function AdminLayout() {
  const { loading, user, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/admin/login") return <Outlet />;

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user) { throw redirect({ to: "/admin/login" }); }
  if (!isAdmin) return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">Your account doesn't have admin privileges.</p>
        <button onClick={async () => { await supabase.auth.signOut(); router.navigate({ to: "/admin/login" }); }} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-2 border-b border-sidebar-border px-6 py-5 font-display text-lg font-bold">Arun Kabeli</Link>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground" }}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
        </nav>
        <button onClick={async () => { await supabase.auth.signOut(); router.navigate({ to: "/admin/login" }); }} className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="border-b bg-card px-6 py-4 md:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="shrink-0 rounded-md px-3 py-1 text-xs" activeProps={{ className: "bg-primary text-primary-foreground" }}>{n.label}</Link>
            ))}
          </div>
        </div>
        <div className="p-6 md:p-10"><Outlet /></div>
      </main>
    </div>
  );
}
