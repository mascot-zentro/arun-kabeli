import { AdminSpecs, SPECS } from "@/components/AdminSpecs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X, Eye, EyeOff, ChevronUp, ChevronDown, Mountain } from "lucide-react";

export const Route = createFileRoute("/admin/projects")({ component: AdminProjects });

type Project = {
  id?: string;
  name: string;
  slug: string;
  location: string | null;
  capacity_mw: number | null;
  status: string | null;
  description: string | null;
  cover_photo_url: string | null;
  gallery_urls: string[];        // stored as JSONB column (we'll add it via migration)
  sort_order: number;
  is_published: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  construction: "Construction",
  operational: "Operational",
};
const STATUS_COLORS: Record<string, string> = {
  planning: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  construction: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  operational: "bg-green-500/15 text-green-700 dark:text-green-400",
};

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["projects"] });
  qc.invalidateQueries({ queryKey: ["projects-featured"] });
}

function AdminProjects() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Partial<Project> | null>(null);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () =>
      (await supabase.from("projects").select("*").order("sort_order")).data ?? [],
  });

  async function save(p: Partial<Project>) {
    const payload = {
      name: p.name!,
      slug: p.slug || slugify(p.name!),
      location: p.location ?? null,
      capacity_mw: p.capacity_mw ?? null,
      status: p.status ?? "planning",
      description: p.description ?? null,
      cover_photo_url: p.cover_photo_url ?? null,
      gallery_urls: p.gallery_urls ?? [],
      sort_order: p.sort_order ?? 0,
      is_published: p.is_published ?? true,
    };
    const { error } = p.id
      ? await supabase.from("projects").update(payload).eq("id", p.id)
      : await supabase.from("projects").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setEdit(null); invalidateAll(qc); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); invalidateAll(qc); }
  }

  async function togglePublished(id: string, current: boolean) {
    await supabase.from("projects").update({ is_published: !current }).eq("id", id);
    invalidateAll(qc);
  }

  async function move(id: string, dir: -1 | 1) {
    const list = [...(projects ?? [])] as Project[];
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    await Promise.all([
      supabase.from("projects").update({ sort_order: list[swapIdx].sort_order }).eq("id", list[idx].id!),
      supabase.from("projects").update({ sort_order: list[idx].sort_order }).eq("id", list[swapIdx].id!),
    ]);
    invalidateAll(qc);
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
          <p className="text-muted-foreground">Manage hydropower projects shown on the public site.</p>
        </div>
        <button
          onClick={() => setEdit({ name: "", slug: "", gallery_urls: [], sort_order: (projects?.length ?? 0), is_published: true } as any)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      {/* Card grid */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(projects ?? []).map((p: any, idx: number) => (
          <div
            key={p.id}
            className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all ${!p.is_published ? "opacity-60" : ""}`}
          >
            {/* Cover image */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              {p.cover_photo_url ? (
                <img src={p.cover_photo_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-mesh)" }}>
                  <Mountain className="h-10 w-10 text-white/30" />
                </div>
              )}
              {/* Status badge */}
              <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status ?? "planning"] ?? ""}`}>
                {STATUS_LABELS[p.status ?? "planning"] ?? p.status}
              </span>
              {/* Sort controls */}
              <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => move(p.id, -1)} disabled={idx === 0} className="flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white disabled:opacity-30 hover:bg-black/70">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button onClick={() => move(p.id, 1)} disabled={idx === (projects?.length ?? 0) - 1} className="flex h-6 w-6 items-center justify-center rounded bg-black/50 text-white disabled:opacity-30 hover:bg-black/70">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-display text-base font-bold leading-tight">{p.name}</h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">/{p.slug}</p>
              {p.location && <p className="mt-1 text-xs text-muted-foreground">{p.location}</p>}
              {p.capacity_mw && (
                <p className="mt-1 font-mono text-sm font-semibold text-primary">{p.capacity_mw} MW</p>
              )}
              {p.description && (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">{p.description}</p>
              )}

              {/* Footer row */}
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <div className="flex gap-1.5">
                  {/* Visibility toggle */}
                  <button
                    onClick={() => togglePublished(p.id, p.is_published)}
                    title={p.is_published ? "Unpublish" : "Publish"}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${
                      p.is_published
                        ? "border-green-500/30 bg-green-500/10 text-green-700 hover:bg-green-500/20"
                        : "border-muted text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {p.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {p.is_published ? "Live" : "Draft"}
                  </button>
                  {/* Gallery count */}
                  {(p.gallery_urls?.length ?? 0) > 0 && (
                    <span className="rounded-md border bg-secondary px-2 py-1 text-xs text-muted-foreground">
                      {p.gallery_urls.length} photo{p.gallery_urls.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEdit({ ...p, gallery_urls: p.gallery_urls ?? [] })}
                    className="flex h-7 w-7 items-center justify-center rounded-md border hover:bg-secondary"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {(!projects || projects.length === 0) && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Mountain className="mb-3 h-12 w-12 opacity-20" />
            <p className="font-medium">No projects yet.</p>
            <p className="mt-1 text-sm">Click "New project" to add the first one.</p>
          </div>
        )}
      </div>

      {/* Edit / Create dialog */}
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit" : "New"} project</DialogTitle>
          </DialogHeader>
          {edit && <ProjectForm initial={edit} onSave={save} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Project form ──────────────────────────────────────────────────────────────

function ProjectForm({ initial, onSave }: { initial: Partial<Project>; onSave: (p: Partial<Project>) => void }) {
  const [p, setP] = useState<Partial<Project>>({ ...initial, gallery_urls: initial.gallery_urls ?? [] });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  async function uploadCover(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB per image"); return; }
    setUploadingCover(true);
    const path = `covers/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("photos").upload(path, file);
    if (error) { toast.error(error.message); setUploadingCover(false); return; }
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    setP((prev) => ({ ...prev, cover_photo_url: data.publicUrl }));
    setUploadingCover(false);
  }

  async function uploadGallery(file: File) {
    if ((p.gallery_urls?.length ?? 0) >= 10) { toast.error("Max 10 gallery images"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB per image"); return; }
    setUploadingGallery(true);
    const path = `gallery/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("photos").upload(path, file);
    if (error) { toast.error(error.message); setUploadingGallery(false); return; }
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    setP((prev) => ({ ...prev, gallery_urls: [...(prev.gallery_urls ?? []), data.publicUrl] }));
    setUploadingGallery(false);
  }

  function removeGalleryImage(idx: number) {
    setP((prev) => ({ ...prev, gallery_urls: (prev.gallery_urls ?? []).filter((_, i) => i !== idx) }));
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(p); }}
      className="space-y-4 text-sm"
    >
      {/* Basic info */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="font-medium">Name *</span>
          <input
            required
            value={p.name ?? ""}
            onChange={(e) => setP({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block">
          <span className="font-medium">Slug *</span>
          <input
            required
            value={p.slug ?? ""}
            onChange={(e) => setP({ ...p, slug: slugify(e.target.value) })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block">
          <span className="font-medium">Location</span>
          <input
            value={p.location ?? ""}
            onChange={(e) => setP({ ...p, location: e.target.value })}
            placeholder="e.g. Panchthar, Taplejung"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block">
          <span className="font-medium">Capacity (MW)</span>
          <input
            type="number"
            step="0.1"
            value={p.capacity_mw ?? ""}
            onChange={(e) => setP({ ...p, capacity_mw: parseFloat(e.target.value) || null })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
        <label className="block">
          <span className="font-medium">Status</span>
          <select
            value={p.status ?? "planning"}
            onChange={(e) => setP({ ...p, status: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="planning">Planning</option>
            <option value="construction">Construction</option>
            <option value="operational">Operational</option>
          </select>
        </label>
        <label className="block">
          <span className="font-medium">Sort order</span>
          <input
            type="number"
            value={p.sort_order ?? 0}
            onChange={(e) => setP({ ...p, sort_order: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>

      {/* Description */}
      <label className="block">
        <span className="font-medium">Description</span>
        <span className="ml-2 text-xs text-muted-foreground">Separate paragraphs with blank lines</span>
        <textarea
          rows={6}
          value={p.description ?? ""}
          onChange={(e) => setP({ ...p, description: e.target.value })}
          placeholder="Describe the project — its size, location, technology, impact…"
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>

      {/* Cover photo */}
      <div>
        <span className="font-medium">Cover photo</span>
        <span className="ml-2 text-xs text-muted-foreground">Shown on project cards and hero</span>
        {p.cover_photo_url && (
          <div className="relative mt-2">
            <img src={p.cover_photo_url} alt="Cover" className="aspect-video w-full rounded-xl object-cover shadow-sm" />
            <button
              type="button"
              onClick={() => setP({ ...p, cover_photo_url: null })}
              className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs hover:bg-secondary">
          <Upload className="h-4 w-4" />
          {uploadingCover ? "Uploading…" : p.cover_photo_url ? "Replace" : "Upload cover"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
        </label>
      </div>

      {/* Gallery */}
      <div>
        <span className="font-medium">Gallery</span>
        <span className="ml-2 text-xs text-muted-foreground">Up to 10 photos shown on the project detail page</span>
        {(p.gallery_urls ?? []).length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {(p.gallery_urls ?? []).map((url, idx) => (
              <div key={idx} className="relative">
                <img src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(idx)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs hover:bg-secondary">
          <Upload className="h-4 w-4" />
          {uploadingGallery ? "Uploading…" : "Add gallery photo"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadGallery(e.target.files[0])} />
        </label>
      </div>

      {/* Publish toggle */}
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-secondary/30 p-3">
        <input
          type="checkbox"
          checked={p.is_published ?? true}
          onChange={(e) => setP({ ...p, is_published: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
        <div>
          <span className="font-medium">Published</span>
          <p className="text-xs text-muted-foreground">Unpublished projects are hidden from the public site.</p>
        </div>
      </label>

      <button
        type="submit"
        className="w-full rounded-md bg-primary py-2.5 font-semibold text-primary-foreground hover:opacity-90 transition"
      >
        Save project
      </button>
    </form>
  );
}
