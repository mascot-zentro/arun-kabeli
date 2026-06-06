import { AdminSpecs, SPECS } from "@/components/AdminSpecs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Mountain } from "lucide-react";

export const Route = createFileRoute("/admin/projects")({ component: AdminProjects });

const STATUS_COLORS: Record<string, string> = {
  planning:     "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  construction: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  operational:  "bg-green-500/15 text-green-700 dark:text-green-400",
};
const STATUS_LABELS: Record<string, string> = {
  planning: "Planning", construction: "Construction", operational: "Operational",
};

function AdminProjects() {
  const qc = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () =>
      (await supabase.from("projects").select("*").order("sort_order")).data ?? [],
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["projects-featured"] });
  }

  async function remove(e: React.MouseEvent, id: string) {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Delete this project? This cannot be undone.")) return;
    await supabase.from("projects").delete().eq("id", id);
    toast.success("Deleted");
    invalidate();
  }

  async function togglePublished(e: React.MouseEvent, id: string, current: boolean) {
    e.preventDefault(); e.stopPropagation();
    await supabase.from("projects").update({ is_published: !current }).eq("id", id);
    invalidate();
  }

  async function move(e: React.MouseEvent, id: string, dir: -1 | 1) {
    e.preventDefault(); e.stopPropagation();
    const list = [...(projects ?? [])] as any[];
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    await Promise.all([
      supabase.from("projects").update({ sort_order: list[swapIdx].sort_order }).eq("id", list[idx].id),
      supabase.from("projects").update({ sort_order: list[idx].sort_order }).eq("id", list[swapIdx].id),
    ]);
    invalidate();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">Projects</h1>
            <AdminSpecs items={SPECS.projectCover} />
          </div>
          <p className="text-muted-foreground">Click a project to edit its details.</p>
        </div>
        <Link
          to="/admin/projects/$id"
          params={{ id: "new" }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" /> New project
        </Link>
      </div>

      {/* Card grid */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(projects ?? []).map((p: any, idx: number) => (
          <Link
            key={p.id}
            to="/admin/projects/$id"
            params={{ id: p.id }}
            className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md ${!p.is_published ? "opacity-60" : ""}`}
          >
            {/* Cover */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              {p.cover_photo_url ? (
                <img src={p.cover_photo_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-mesh)" }}>
                  <Mountain className="h-10 w-10 text-white/30" />
                </div>
              )}
              {/* Status badge */}
              <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status ?? "planning"] ?? ""}`}>
                {STATUS_LABELS[p.status ?? "planning"] ?? p.status}
              </span>
              {/* Sort controls — top right */}
              <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={(e) => move(e, p.id, -1)} disabled={idx === 0} className="flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white hover:bg-black/70 disabled:opacity-30">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button onClick={(e) => move(e, p.id, 1)} disabled={idx === (projects?.length ?? 0) - 1} className="flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white hover:bg-black/70 disabled:opacity-30">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-display text-base font-bold leading-tight group-hover:text-primary transition-colors">{p.name}</h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">/{p.slug}</p>
              {p.location && <p className="mt-1 text-xs text-muted-foreground">{p.location}</p>}
              {p.capacity_mw && <p className="mt-1 font-mono text-sm font-bold text-primary">{p.capacity_mw} MW</p>}
              {p.description && (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">{p.description}</p>
              )}

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <button
                  onClick={(e) => togglePublished(e, p.id, p.is_published)}
                  title={p.is_published ? "Unpublish" : "Publish"}
                  className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition ${
                    p.is_published
                      ? "border-green-500/30 bg-green-500/10 text-green-700 hover:bg-green-500/20"
                      : "border-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {p.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {p.is_published ? "Live" : "Draft"}
                </button>
                <div className="flex gap-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-background text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </div>
                  <button
                    onClick={(e) => remove(e, p.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {(!projects || projects.length === 0) && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Mountain className="mb-3 h-12 w-12 opacity-20" />
            <p className="font-medium">No projects yet.</p>
            <p className="mt-1 text-sm">Click "New project" to add the first one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
