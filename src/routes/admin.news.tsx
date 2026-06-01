import { AdminSpecs, SPECS } from "@/components/AdminSpecs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff, ImagePlus, X } from "lucide-react";

export const Route = createFileRoute("/admin/news")({ component: AdminNews });

type Article = { id?: string; title: string; slug: string; cover_image_url: string | null; excerpt: string | null; content: string | null; is_published: boolean | null; published_at: string | null };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function AdminNews() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Partial<Article> | null>(null);
  const { data: items } = useQuery({
    queryKey: ["news"],
    queryFn: async () => (await supabase.from("news").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function save(a: Partial<Article>) {
    if (!a.title?.trim()) { toast.error("Please add a title"); return; }
    const slug = a.slug?.trim() || slugify(a.title);
    const payload = {
      title: a.title.trim(),
      slug,
      cover_image_url: a.cover_image_url ?? null,
      excerpt: a.excerpt?.trim() || null,
      content: a.content ?? null,
      is_published: a.is_published ?? false,
      published_at: a.is_published ? (a.published_at ?? new Date().toISOString()) : null,
    };
    const { error } = a.id ? await supabase.from("news").update(payload).eq("id", a.id) : await supabase.from("news").insert(payload);
    if (error) toast.error(error.message); else { toast.success(a.is_published ? "Published" : "Saved as draft"); setEdit(null); qc.invalidateQueries({ queryKey: ["news"] }); qc.invalidateQueries({ queryKey: ["news-latest"] }); }
  }
  async function togglePublish(a: any) {
    const next = !a.is_published;
    const { error } = await supabase.from("news").update({ is_published: next, published_at: next ? (a.published_at ?? new Date().toISOString()) : null }).eq("id", a.id);
    if (error) toast.error(error.message); else { toast.success(next ? "Published" : "Unpublished"); qc.invalidateQueries({ queryKey: ["news"] }); qc.invalidateQueries({ queryKey: ["news-latest"] }); }
  }
  async function remove(id: string) {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    await supabase.from("news").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["news"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3"><h1 className="font-display text-3xl font-bold">News</h1><AdminSpecs items={SPECS.newsCover} /></div>
          <p className="text-muted-foreground">Write announcements and updates. Save as a draft, then publish when ready.</p>
        </div>
        <button onClick={() => setEdit({ is_published: false } as any)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New article</button>
      </div>

      <div className="mt-8 space-y-3">
        {items?.map((a) => (
          <div key={a.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
            {a.cover_image_url
              ? <img src={a.cover_image_url} alt="" className="h-16 w-24 rounded-md object-cover" />
              : <div className="flex h-16 w-24 items-center justify-center rounded-md bg-secondary text-muted-foreground"><ImagePlus className="h-5 w-5" /></div>}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold">{a.title}</h3>
                {a.is_published
                  ? <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">Published</span>
                  : <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">Draft</span>}
              </div>
              <p className="truncate text-xs text-muted-foreground">/news/{a.slug}</p>
            </div>
            <button onClick={() => togglePublish(a)} title={a.is_published ? "Unpublish" : "Publish"} className="rounded-md p-2 hover:bg-secondary">
              {a.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button onClick={() => setEdit(a as any)} title="Edit" className="rounded-md p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(a.id)} title="Delete" className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {(!items || items.length === 0) && (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <p className="text-muted-foreground">No articles yet.</p>
            <button onClick={() => setEdit({ is_published: false } as any)} className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Write your first article</button>
          </div>
        )}
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
          {edit && <NewsForm initial={edit} onSave={save} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewsForm({ initial, onSave }: { initial: Partial<Article>; onSave: (a: Partial<Article>) => void }) {
  const [a, setA] = useState<Partial<Article>>(initial);
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!initial.id); // don't auto-rewrite slug when editing

  // Auto-generate slug from title until user edits it manually
  useEffect(() => {
    if (!slugTouched && a.title) setA((prev) => ({ ...prev, slug: slugify(a.title || "") }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.title]);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("news-covers").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("news-covers").getPublicUrl(path);
    setA((prev) => ({ ...prev, cover_image_url: data.publicUrl }));
    setUploading(false);
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(a); }} className="space-y-5 text-sm">
      {/* Title */}
      <label className="block">
        <span className="font-medium">Title <span className="text-destructive">*</span></span>
        <input required value={a.title ?? ""} onChange={(e) => setA({ ...a, title: e.target.value })} placeholder="e.g. Arun Kabeli signs new PPA" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-base" />
      </label>

      {/* Slug */}
      <label className="block">
        <span className="font-medium">URL</span>
        <span className="block text-xs text-muted-foreground">Auto-filled from the title. Only edit if needed.</span>
        <div className="mt-1 flex items-center rounded-md border bg-background">
          <span className="px-3 py-2 text-xs text-muted-foreground">/news/</span>
          <input
            value={a.slug ?? ""}
            onChange={(e) => { setSlugTouched(true); setA({ ...a, slug: slugify(e.target.value) }); }}
            className="flex-1 rounded-r-md bg-transparent px-2 py-2 font-mono text-xs outline-none"
          />
        </div>
      </label>

      {/* Cover image */}
      <div>
        <span className="font-medium">Cover image</span>
        <span className="block text-xs text-muted-foreground">Recommended 1600×900 (16:9), under 5 MB.</span>
        {a.cover_image_url ? (
          <div className="relative mt-2">
            <img src={a.cover_image_url} alt="" className="aspect-video w-full rounded-md object-cover" />
            <button type="button" onClick={() => setA({ ...a, cover_image_url: null })} className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-secondary/40 py-8 text-muted-foreground hover:bg-secondary">
            <Upload className="h-5 w-5" />
            <span className="text-xs">{uploading ? "Uploading…" : "Click to upload cover image"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        )}
      </div>

      {/* Excerpt */}
      <label className="block">
        <span className="flex items-center justify-between"><span className="font-medium">Short summary</span><span className="text-xs text-muted-foreground">{(a.excerpt ?? "").length}/200</span></span>
        <span className="block text-xs text-muted-foreground">Shown on the news list and in search results.</span>
        <textarea rows={2} maxLength={200} value={a.excerpt ?? ""} onChange={(e) => setA({ ...a, excerpt: e.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
      </label>

      {/* Content */}
      <label className="block">
        <span className="font-medium">Article body</span>
        <span className="block text-xs text-muted-foreground">Write naturally — leave a blank line between paragraphs.</span>
        <textarea rows={12} value={a.content ?? ""} onChange={(e) => setA({ ...a, content: e.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 leading-relaxed" />
      </label>

      {/* Publish toggle */}
      <div className="flex items-center justify-between rounded-md border bg-secondary/40 p-3">
        <div>
          <p className="font-medium">{a.is_published ? "Published" : "Draft"}</p>
          <p className="text-xs text-muted-foreground">{a.is_published ? "Visible to everyone on your website." : "Only visible to you in the admin panel."}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!!a.is_published}
          onClick={() => setA({ ...a, is_published: !a.is_published })}
          className={`relative h-6 w-11 rounded-full transition ${a.is_published ? "bg-accent" : "bg-muted-foreground/30"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${a.is_published ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-md bg-primary py-2.5 font-semibold text-primary-foreground">{a.is_published ? "Save & publish" : "Save draft"}</button>
      </div>
    </form>
  );
}
