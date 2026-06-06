import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Save, Trash2, Eye, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/projects/$id")({ component: AdminProjectEdit });

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type SalientFeature = { id: string; icon: string; label: string; value: string };

type Project = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  capacity_mw: number | null;
  status: string;
  description: string | null;
  cover_photo_url: string | null;
  salient_features: SalientFeature[];
  sort_order: number;
  is_published: boolean;
};

type Photo = { id: string; url: string; alt_text: string | null; project_id: string | null };

function AdminProjectEdit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = id === "new";

  const { data: existing, isLoading } = useQuery({
    queryKey: ["project-edit", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      return data as Project | null;
    },
  });

  const { data: galleryPhotos, refetch: refetchGallery } = useQuery({
    queryKey: ["project-gallery-edit", id],
    enabled: !isNew,
    queryFn: async () =>
      (await supabase.from("photos").select("*").eq("project_id", id).order("uploaded_at")).data ?? [] as Photo[],
  });

  const [form, setForm] = useState<Partial<Project>>({
    name: "", slug: "", location: "", capacity_mw: null,
    status: "planning", description: "", cover_photo_url: null,
    salient_features: [], sort_order: 0, is_published: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (existing) setForm({
      ...existing,
      salient_features: (existing as any).salient_features ?? [],
    });
  }, [existing]);

  function set(patch: Partial<Project>) { setForm((f) => ({ ...f, ...patch })); }

  async function save() {
    if (!form.name?.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = {
      name: form.name!,
      slug: form.slug || slugify(form.name!),
      location: form.location || null,
      capacity_mw: form.capacity_mw ?? null,
      status: form.status ?? "planning",
      description: form.description || null,
      cover_photo_url: form.cover_photo_url || null,
      salient_features: form.salient_features ?? [],
      sort_order: form.sort_order ?? 0,
      is_published: form.is_published ?? true,
    };
    if (isNew) {
      const { data, error } = await supabase.from("projects").insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects-featured"] });
      navigate({ to: "/admin/projects/$id", params: { id: data.id } });
    } else {
      const { error } = await supabase.from("projects").update(payload).eq("id", id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects-featured"] });
      qc.invalidateQueries({ queryKey: ["project-edit", id] });
    }
    setSaving(false);
  }

  async function deleteProject() {
    if (!confirm("Permanently delete this project? This cannot be undone.")) return;
    setDeleting(true);
    await supabase.from("projects").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["projects-featured"] });
    toast.success("Project deleted");
    navigate({ to: "/admin/projects" });
  }

  async function uploadCover(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setUploadingCover(true);
    const path = `covers/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("photos").upload(path, file);
    if (error) { toast.error(error.message); setUploadingCover(false); return; }
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    set({ cover_photo_url: data.publicUrl });
    setUploadingCover(false);
  }

  async function uploadGalleryPhoto(file: File) {
    if ((galleryPhotos?.length ?? 0) >= 20) { toast.error("Max 20 gallery photos"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setUploadingGallery(true);
    const path = `gallery/${Date.now()}-${file.name}`;
    const { error: storageErr } = await supabase.storage.from("photos").upload(path, file);
    if (storageErr) { toast.error(storageErr.message); setUploadingGallery(false); return; }
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    if (!isNew) {
      await supabase.from("photos").insert({ url: data.publicUrl, project_id: id });
      refetchGallery();
    }
    setUploadingGallery(false);
    toast.success("Photo added");
  }

  async function removeGalleryPhoto(photoId: string) {
    await supabase.from("photos").delete().eq("id", photoId);
    refetchGallery();
    qc.invalidateQueries({ queryKey: ["project-photos", id] });
  }

  if (!isNew && isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/projects"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All projects
          </Link>
          <h1 className="font-display text-3xl font-bold">
            {isNew ? "New project" : (form.name || "Edit project")}
          </h1>
          {!isNew && form.slug && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">/{form.slug}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && form.slug && (
            <a
              href={`/projects/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-secondary"
            >
              <ExternalLink className="h-4 w-4" /> Preview
            </a>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90 transition"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

        {/* ── Left column: main content ── */}
        <div className="space-y-6">

          {/* Basic info card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Basic information</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Project name *</span>
                <input
                  value={form.name ?? ""}
                  onChange={(e) => set({ name: e.target.value, slug: form.slug || slugify(e.target.value) })}
                  placeholder="e.g. Kabeli B-1 Hydropower Project"
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">URL slug *</span>
                <div className="mt-1.5 flex items-center gap-0">
                  <span className="rounded-l-lg border border-r-0 bg-secondary px-3 py-2.5 text-xs text-muted-foreground">/projects/</span>
                  <input
                    value={form.slug ?? ""}
                    onChange={(e) => set({ slug: slugify(e.target.value) })}
                    className="flex-1 rounded-r-lg border bg-background px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Location</span>
                  <input
                    value={form.location ?? ""}
                    onChange={(e) => set({ location: e.target.value })}
                    placeholder="e.g. Panchthar, Taplejung"
                    className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Capacity (MW)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.capacity_mw ?? ""}
                    onChange={(e) => set({ capacity_mw: parseFloat(e.target.value) || null })}
                    placeholder="e.g. 25"
                    className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Description card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Description</h2>
            <p className="mb-3 text-xs text-muted-foreground">Full project description shown on the project page. Separate paragraphs with a blank line.</p>
            <textarea
              rows={14}
              value={form.description ?? ""}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Describe the project — its history, technology, location, capacity, impact on the community and national grid…"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Salient features card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Salient Features</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Key facts shown as a highlights grid on the project page.</p>
              </div>
              <button
                type="button"
                onClick={() => set({
                  salient_features: [...(form.salient_features ?? []), { id: Date.now().toString(), icon: "zap", label: "", value: "" }]
                })}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-secondary transition"
              >
                + Add feature
              </button>
            </div>

            {(form.salient_features ?? []).length === 0 && (
              <div className="flex items-center justify-center rounded-lg border border-dashed py-8 text-sm text-muted-foreground">
                No salient features yet — click "Add feature" to add one.
              </div>
            )}

            <div className="space-y-3">
              {(form.salient_features ?? []).map((feat, idx) => (
                <div key={feat.id} className="grid grid-cols-[110px_1fr_1fr_36px] gap-2 items-center">
                  {/* Icon picker */}
                  <select
                    value={feat.icon}
                    onChange={(e) => {
                      const updated = [...(form.salient_features ?? [])];
                      updated[idx] = { ...feat, icon: e.target.value };
                      set({ salient_features: updated });
                    }}
                    className="rounded-lg border bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="zap">⚡ Energy</option>
                    <option value="droplets">💧 Water</option>
                    <option value="mountain">⛰ Mountain</option>
                    <option value="map-pin">📍 Location</option>
                    <option value="calendar">📅 Date</option>
                    <option value="users">👥 Community</option>
                    <option value="activity">📈 Activity</option>
                    <option value="shield">🛡 Compliance</option>
                    <option value="ruler">📏 Dimension</option>
                    <option value="clock">🕐 Duration</option>
                    <option value="dollar">💰 Investment</option>
                    <option value="leaf">🌿 Environment</option>
                    <option value="building">🏗 Infrastructure</option>
                    <option value="globe">🌐 Transmission</option>
                  </select>
                  {/* Label */}
                  <input
                    value={feat.label}
                    onChange={(e) => {
                      const updated = [...(form.salient_features ?? [])];
                      updated[idx] = { ...feat, label: e.target.value };
                      set({ salient_features: updated });
                    }}
                    placeholder="Label (e.g. Plant Type)"
                    className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {/* Value */}
                  <input
                    value={feat.value}
                    onChange={(e) => {
                      const updated = [...(form.salient_features ?? [])];
                      updated[idx] = { ...feat, value: e.target.value };
                      set({ salient_features: updated });
                    }}
                    placeholder="Value (e.g. Run-of-River)"
                    className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => set({ salient_features: (form.salient_features ?? []).filter((_, i) => i !== idx) })}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border text-destructive hover:bg-destructive/10 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery card */}
          {!isNew && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Gallery</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Photos shown in the gallery section of the project page.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs hover:bg-secondary">
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingGallery ? "Uploading…" : "Add photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadGalleryPhoto(e.target.files[0])} />
                </label>
              </div>
              {galleryPhotos && galleryPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {(galleryPhotos as Photo[]).map((photo) => (
                    <div key={photo.id} className="group relative">
                      <img src={photo.url} alt="" className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
                      <button
                        onClick={() => removeGalleryPhoto(photo.id)}
                        className="absolute right-1 top-1 hidden rounded-full bg-destructive p-1 text-destructive-foreground shadow group-hover:flex"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                  <p className="text-sm">No gallery photos yet.</p>
                  <p className="mt-1 text-xs">Click "Add photo" to upload images.</p>
                </div>
              )}
            </div>
          )}
          {isNew && (
            <div className="rounded-xl border border-dashed bg-secondary/20 p-5 text-center text-sm text-muted-foreground">
              Save the project first, then you can add gallery photos.
            </div>
          )}
        </div>

        {/* ── Right column: settings ── */}
        <div className="space-y-5">

          {/* Status */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Settings</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Status</span>
                <select
                  value={form.status ?? "planning"}
                  onChange={(e) => set({ status: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="planning">Planning</option>
                  <option value="construction">Construction</option>
                  <option value="operational">Operational</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Sort order</span>
                <input
                  type="number"
                  value={form.sort_order ?? 0}
                  onChange={(e) => set({ sort_order: parseInt(e.target.value) || 0 })}
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border bg-background p-3">
                <div>
                  <span className="text-sm font-medium">Published</span>
                  <p className="text-xs text-muted-foreground">Visible on the public site</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.is_published ?? true}
                  onChange={(e) => set({ is_published: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
              </label>
            </div>
          </div>

          {/* Cover photo */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cover photo</h2>
            {form.cover_photo_url ? (
              <div className="relative">
                <img src={form.cover_photo_url} alt="Cover" className="aspect-video w-full rounded-lg object-cover shadow-sm" />
                <button
                  onClick={() => set({ cover_photo_url: null })}
                  className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed bg-secondary/30 text-sm text-muted-foreground">
                No cover photo
              </div>
            )}
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border py-2.5 text-sm hover:bg-secondary transition">
              <Upload className="h-4 w-4" />
              {uploadingCover ? "Uploading…" : form.cover_photo_url ? "Replace cover" : "Upload cover"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
            </label>
          </div>

          {/* Danger zone */}
          {!isNew && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
              <h2 className="mb-1 text-sm font-semibold text-destructive">Danger zone</h2>
              <p className="mb-3 text-xs text-muted-foreground">Permanently delete this project and all associated data.</p>
              <button
                onClick={deleteProject}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting…" : "Delete project"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
