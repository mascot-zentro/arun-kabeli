import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";

export const Route = createFileRoute("/admin/subsidiaries")({ component: AdminSubsidiaries });

type Sub = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  images: string[];
  website: string | null;
  sort_order: number | null;
  is_visible: boolean | null;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function AdminSubsidiaries() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Partial<Sub> | null>(null);

  const { data: items } = useQuery({
    queryKey: ["subsidiaries"],
    queryFn: async () =>
      (await supabase.from("subsidiaries").select("*").order("sort_order")).data ?? [],
  });

  async function save(s: Partial<Sub>) {
    const payload = {
      name: s.name!,
      slug: s.slug || slugify(s.name!),
      description: s.description ?? null,
      images: s.images ?? [],
      website: s.website ?? null,
      sort_order: s.sort_order ?? 0,
      is_visible: s.is_visible ?? true,
    };
    const { error } = s.id
      ? await supabase.from("subsidiaries").update(payload).eq("id", s.id)
      : await supabase.from("subsidiaries").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["subsidiaries"] });
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    await supabase.from("subsidiaries").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["subsidiaries"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Subsidiaries</h1>
          <p className="text-muted-foreground">Manage subsidiary / sub-company entries.</p>
        </div>
        <button
          onClick={() => setEdit({ name: "", slug: "", images: [], sort_order: 0, is_visible: true } as any)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-4">
            {s.images?.[0] && (
              <img src={s.images[0]} alt={s.name} className="mb-3 aspect-video w-full rounded-md object-cover" />
            )}
            <h3 className="font-display text-lg font-bold">{s.name}</h3>
            <p className="text-xs text-muted-foreground">/{s.slug}</p>
            {s.description && (
              <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{s.description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {s.is_visible ? "Visible" : "Hidden"} &middot; #{s.sort_order} &middot; {s.images?.length ?? 0} image(s)
            </p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEdit(s as any)} className="flex-1 rounded-md border py-1.5 text-xs hover:bg-secondary">
                <Pencil className="mx-auto h-3 w-3" />
              </button>
              <button onClick={() => remove(s.id)} className="flex-1 rounded-md border py-1.5 text-xs text-destructive hover:bg-destructive/10">
                <Trash2 className="mx-auto h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {(!items || items.length === 0) && (
          <p className="col-span-full py-8 text-center text-muted-foreground">No subsidiaries yet.</p>
        )}
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit" : "New"} subsidiary</DialogTitle>
          </DialogHeader>
          {edit && <SubForm initial={edit} onSave={save} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubForm({ initial, onSave }: { initial: Partial<Sub>; onSave: (s: Partial<Sub>) => void }) {
  const [s, setS] = useState<Partial<Sub>>({ ...initial, images: initial.images ?? [] });
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if ((s.images?.length ?? 0) >= 4) {
      toast.error("Max 4 images");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("subsidiary-photos").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("subsidiary-photos").getPublicUrl(path);
    setS({ ...s, images: [...(s.images ?? []), data.publicUrl] });
    setUploading(false);
  }

  function removeImage(idx: number) {
    setS({ ...s, images: (s.images ?? []).filter((_, i) => i !== idx) });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(s);
      }}
      className="space-y-3 text-sm"
    >
      <label className="block">
        <span className="font-medium">Name</span>
        <input
          required
          value={s.name ?? ""}
          onChange={(e) => setS({ ...s, name: e.target.value, slug: s.slug || slugify(e.target.value) })}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="font-medium">Slug</span>
        <input
          value={s.slug ?? ""}
          onChange={(e) => setS({ ...s, slug: slugify(e.target.value) })}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="font-medium">Website</span>
        <input
          type="url"
          placeholder="https://..."
          value={s.website ?? ""}
          onChange={(e) => setS({ ...s, website: e.target.value })}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="font-medium">Description</span>
        <span className="ml-2 text-xs text-muted-foreground">2–3 paragraphs (separate with blank lines)</span>
        <textarea
          rows={8}
          value={s.description ?? ""}
          onChange={(e) => setS({ ...s, description: e.target.value })}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        />
      </label>

      <div>
        <span className="font-medium">Images (up to 4)</span>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {(s.images ?? []).map((url, idx) => (
            <div key={idx} className="relative">
              <img src={url} alt="" className="aspect-square w-full rounded-md object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2">
          <Upload className="h-4 w-4" />
          {uploading ? "..." : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="font-medium">Sort order</span>
          <input
            type="number"
            value={s.sort_order ?? 0}
            onChange={(e) => setS({ ...s, sort_order: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label className="flex items-end gap-2">
          <input
            type="checkbox"
            checked={s.is_visible ?? true}
            onChange={(e) => setS({ ...s, is_visible: e.target.checked })}
          />
          <span>Visible</span>
        </label>
      </div>

      <button className="w-full rounded-md bg-primary py-2 font-semibold text-primary-foreground">Save</button>
    </form>
  );
}
