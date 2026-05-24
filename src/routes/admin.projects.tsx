import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/projects")({ component: AdminProjects });

type Project = { id: string; name: string; slug: string; location: string | null; capacity_mw: number | null; status: string | null; description: string | null; cover_photo_url: string | null; sort_order: number | null; is_published: boolean | null };

function AdminProjects() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Partial<Project> | null>(null);
  const { data: projects } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => (await supabase.from("projects").select("*").order("sort_order")).data ?? [],
  });

  async function save(p: Partial<Project>) {
    const payload = { name: p.name!, slug: p.slug!, location: p.location ?? null, capacity_mw: p.capacity_mw ?? null, status: p.status ?? "planning", description: p.description ?? null, cover_photo_url: p.cover_photo_url ?? null, sort_order: p.sort_order ?? 0, is_published: p.is_published ?? true };
    const { error } = p.id ? await supabase.from("projects").update(payload).eq("id", p.id) : await supabase.from("projects").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setEdit(null); qc.invalidateQueries({ queryKey: ["admin-projects"] }); }
  }
  async function remove(id: string) {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-projects"] }); }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div><div className="flex items-center gap-3"><h1 className="font-display text-3xl font-bold">Projects</h1><AdminSpecs items={SPECS.projectCover} /></div><p className="text-muted-foreground">Manage hydropower projects.</p></div>
        <button onClick={() => setEdit({})} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New</button>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left font-mono text-xs uppercase">
            <tr><th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">MW</th><th className="p-3">Status</th><th className="p-3">Order</th><th className="p-3">Pub</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {projects?.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">{p.slug}</td>
                <td className="p-3 font-mono">{p.capacity_mw}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3">{p.sort_order}</td>
                <td className="p-3">{p.is_published ? "✓" : "—"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setEdit(p)} className="rounded p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p.id)} className="rounded p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {(!projects || projects.length === 0) && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No projects yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "New"} project</DialogTitle></DialogHeader>
          {edit && <ProjectForm initial={edit} onSave={save} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectForm({ initial, onSave }: { initial: Partial<Project>; onSave: (p: Partial<Project>) => void }) {
  const [p, setP] = useState<Partial<Project>>(initial);
  const [uploading, setUploading] = useState(false);
  async function upload(file: File) {
    setUploading(true);
    const path = `covers/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("photos").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    setP({ ...p, cover_photo_url: data.publicUrl });
    setUploading(false);
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(p); }} className="space-y-3 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1"><span className="font-medium">Name</span><input required value={p.name ?? ""} onChange={(e) => setP({ ...p, name: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="space-y-1"><span className="font-medium">Slug</span><input required value={p.slug ?? ""} onChange={(e) => setP({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} className="w-full rounded-md border bg-background px-3 py-2 font-mono" /></label>
        <label className="space-y-1"><span className="font-medium">Location</span><input value={p.location ?? ""} onChange={(e) => setP({ ...p, location: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="space-y-1"><span className="font-medium">Capacity (MW)</span><input type="number" step="0.1" value={p.capacity_mw ?? ""} onChange={(e) => setP({ ...p, capacity_mw: parseFloat(e.target.value) || null })} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="space-y-1"><span className="font-medium">Status</span>
          <select value={p.status ?? "planning"} onChange={(e) => setP({ ...p, status: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2">
            <option value="planning">Planning</option><option value="construction">Construction</option><option value="operational">Operational</option>
          </select>
        </label>
        <label className="space-y-1"><span className="font-medium">Sort order</span><input type="number" value={p.sort_order ?? 0} onChange={(e) => setP({ ...p, sort_order: parseInt(e.target.value) || 0 })} className="w-full rounded-md border bg-background px-3 py-2" /></label>
      </div>
      <label className="block space-y-1"><span className="font-medium">Description</span><textarea rows={5} value={p.description ?? ""} onChange={(e) => setP({ ...p, description: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <div className="space-y-1">
        <span className="font-medium">Cover photo</span>
        {p.cover_photo_url && <img src={p.cover_photo_url} alt="" className="aspect-video w-full rounded-md object-cover" />}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2"><Upload className="h-4 w-4" />{uploading ? "Uploading..." : "Upload"}<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label>
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_published ?? true} onChange={(e) => setP({ ...p, is_published: e.target.checked })} /><span>Published</span></label>
      <button type="submit" className="w-full rounded-md bg-primary py-2.5 font-semibold text-primary-foreground">Save</button>
    </form>
  );
}
