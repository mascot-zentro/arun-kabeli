import { AdminSpecs, SPECS } from "@/components/AdminSpecs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/gallery")({ component: AdminGallery });

function AdminGallery() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const { data: photos } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => (await supabase.from("photos").select("*, projects(name)").order("sort_order")).data ?? [],
  });
  const { data: projects } = useQuery({
    queryKey: ["projects-select"],
    queryFn: async () => (await supabase.from("projects").select("id, name")).data ?? [],
  });

  async function upload(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const path = `gallery/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, file);
      if (upErr) { toast.error(upErr.message); continue; }
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      await supabase.from("photos").insert({ url: data.publicUrl, alt_text: file.name });
    }
    setUploading(false);
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    toast.success("Uploaded");
  }
  async function remove(id: string, url: string) {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    try {
      const marker = "/storage/v1/object/public/photos/";
      const idx = url.indexOf(marker);
      if (idx !== -1) {
        const path = url.substring(idx + marker.length);
        await supabase.storage.from("photos").remove([path]);
      }
    } catch (e) { /* ignore storage errors, still remove row */ }
    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Photo deleted");
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
  }
  async function update(id: string, fields: any) {
    await supabase.from("photos").update(fields).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-gallery"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div><div className="flex items-center gap-3"><h1 className="font-display text-3xl font-bold">Gallery</h1><AdminSpecs items={SPECS.galleryPhoto} /></div><p className="text-muted-foreground">Upload and tag photos.</p></div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Upload className="h-4 w-4" />{uploading ? "Uploading..." : "Upload photos"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
        </label>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos?.map((p: any) => (
          <div key={p.id} className="rounded-xl border bg-card p-3">
            <img src={p.url} alt={p.alt_text ?? ""} className="aspect-square w-full rounded-md object-cover" />
            <input defaultValue={p.caption ?? ""} onBlur={(e) => e.target.value !== (p.caption ?? "") && update(p.id, { caption: e.target.value })} placeholder="Caption" className="mt-2 w-full rounded-md border bg-background px-2 py-1 text-xs" />
            <select defaultValue={p.project_id ?? ""} onChange={(e) => update(p.id, { project_id: e.target.value || null })} className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-xs">
              <option value="">No project</option>
              {projects?.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
            </select>
            <button onClick={() => remove(p.id, p.url)} className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-destructive/30 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground py-1.5 font-medium"><Trash2 className="h-3 w-3" />Delete</button>
          </div>
        ))}
        {(!photos || photos.length === 0) && <p className="col-span-full py-8 text-center text-muted-foreground">No photos yet.</p>}
      </div>
    </div>
  );
}
