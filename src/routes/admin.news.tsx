import { AdminSpecs, SPECS } from "@/components/AdminSpecs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/news")({ component: AdminNews });

type Article = { id?: string; title: string; slug: string; cover_image_url: string | null; excerpt: string | null; content: string | null; is_published: boolean | null; published_at: string | null };

function AdminNews() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Partial<Article> | null>(null);
  const { data: items } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => (await supabase.from("news").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function save(a: Partial<Article>) {
    const payload = { title: a.title!, slug: a.slug!, cover_image_url: a.cover_image_url ?? null, excerpt: a.excerpt ?? null, content: a.content ?? null, is_published: a.is_published ?? false, published_at: a.is_published ? (a.published_at ?? new Date().toISOString()) : null };
    const { error } = a.id ? await supabase.from("news").update(payload).eq("id", a.id) : await supabase.from("news").insert(payload);
    if (error) toast.error(error.message); else { toast.success("Saved"); setEdit(null); qc.invalidateQueries({ queryKey: ["admin-news"] }); }
  }
  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    await supabase.from("news").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-news"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-3xl font-bold">News</h1><p className="text-muted-foreground">Manage articles.</p></div>
        <button onClick={() => setEdit({ is_published: false } as any)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New article</button>
      </div>

      <div className="mt-8 space-y-3">
        {items?.map((a) => (
          <div key={a.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
            {a.cover_image_url && <img src={a.cover_image_url} alt="" className="h-16 w-24 rounded-md object-cover" />}
            <div className="flex-1">
              <div className="flex items-center gap-2"><h3 className="font-semibold">{a.title}</h3>{a.is_published && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs">Published</span>}</div>
              <p className="text-xs text-muted-foreground">/{a.slug}</p>
            </div>
            <button onClick={() => setEdit(a as any)} className="rounded-md p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(a.id)} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {(!items || items.length === 0) && <p className="py-8 text-center text-muted-foreground">No articles yet.</p>}
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "New"} article</DialogTitle></DialogHeader>
          {edit && <NewsForm initial={edit} onSave={save} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewsForm({ initial, onSave }: { initial: Partial<Article>; onSave: (a: Partial<Article>) => void }) {
  const [a, setA] = useState<Partial<Article>>(initial);
  const [uploading, setUploading] = useState(false);
  async function upload(file: File) {
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("news-covers").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("news-covers").getPublicUrl(path);
    setA({ ...a, cover_image_url: data.publicUrl });
    setUploading(false);
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(a); }} className="space-y-3 text-sm">
      <label className="block"><span className="font-medium">Title</span><input required value={a.title ?? ""} onChange={(e) => setA({ ...a, title: e.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block"><span className="font-medium">Slug</span><input required value={a.slug ?? ""} onChange={(e) => setA({ ...a, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono" /></label>
      <label className="block"><span className="font-medium">Excerpt</span><textarea rows={2} value={a.excerpt ?? ""} onChange={(e) => setA({ ...a, excerpt: e.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block"><span className="font-medium">Content (Markdown / plain text)</span><textarea rows={10} value={a.content ?? ""} onChange={(e) => setA({ ...a, content: e.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs" /></label>
      <div>
        <span className="font-medium">Cover image</span>
        {a.cover_image_url && <img src={a.cover_image_url} alt="" className="my-2 aspect-video w-full rounded-md object-cover" />}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2"><Upload className="h-4 w-4" />{uploading ? "..." : "Upload"}<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label>
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={a.is_published ?? false} onChange={(e) => setA({ ...a, is_published: e.target.checked })} /><span>Published</span></label>
      <button className="w-full rounded-md bg-primary py-2 font-semibold text-primary-foreground">Save</button>
    </form>
  );
}
