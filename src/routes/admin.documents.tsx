import { AdminSpecs, SPECS } from "@/components/AdminSpecs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Trash2, Eye, FileText, GripVertical, ChevronUp, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/admin/documents")({ component: AdminDocs });

type Doc = {
  id: string;
  title: string;
  category: string | null;
  file_url: string;
  file_size_bytes: number | null;
  is_public: boolean | null;
  uploaded_at: string | null;
  show_as_popup: boolean | null;
  popup_sort_order: number | null;
  sort_order: number;
};

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AdminDocs() {
  const qc = useQueryClient();
  const [viewing, setViewing]               = useState<{ url: string; title: string } | null>(null);
  const [uploading, setUploading]           = useState(false);
  const [pendingFile, setPendingFile]       = useState<File | null>(null);
  const [pendingCategory, setPendingCategory] = useState("");

  const { data: docs } = useQuery({
    queryKey: ["admin-docs"],
    queryFn: async () =>
      (await supabase.from("documents").select("*").order("sort_order", { ascending: true })).data ?? [],
  });

  const categories = Array.from(new Set((docs ?? []).map((d: Doc) => d.category).filter(Boolean))) as string[];

  // ── Move a document up or down by swapping sort_order with its neighbour ──
  async function move(id: string, dir: -1 | 1) {
    const list = [...(docs ?? [])] as Doc[];
    const idx = list.findIndex((d) => d.id === id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[idx];
    const b = list[swapIdx];
    await Promise.all([
      supabase.from("documents").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("documents").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    invalidate();
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-docs"] });
    qc.invalidateQueries({ queryKey: ["popup-docs"] });
    qc.invalidateQueries({ queryKey: ["public-documents"] });
  }



  async function confirmUpload() {
    if (!pendingFile) return;
    const file = pendingFile;
    const category = pendingCategory.trim() || "General";
    if (file.size > 50 * 1024 * 1024) { toast.error("Max 50 MB"); return; }
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    const maxOrder = Math.max(0, ...((docs ?? []) as Doc[]).map((d) => d.sort_order ?? 0));
    const { error } = await supabase.from("documents").insert({
      title: file.name,
      file_url: data.publicUrl,
      file_size_bytes: file.size,
      category,
      sort_order: maxOrder + 1,
    });
    setUploading(false);
    setPendingFile(null);
    setPendingCategory("");
    if (error) toast.error(error.message);
    else { toast.success("Uploaded"); invalidate(); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this document?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      invalidate();
      // Re-compact sort_order after deletion
      const remaining = ((docs ?? []) as Doc[]).filter((d) => d.id !== id);
      await Promise.all(remaining.map((d, i) =>
        supabase.from("documents").update({ sort_order: i }).eq("id", d.id)
      ));
      invalidate();
    }
  }

  async function updateField(id: string, field: string, value: unknown) {
    await (supabase.from("documents") as any).update({ [field]: value }).eq("id", id);
    invalidate();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">Documents</h1>
            <AdminSpecs items={SPECS.document} />
          </div>
          <p className="text-muted-foreground">Upload and order PDF files for the public Documents page.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload file"}
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) { setPendingFile(e.target.files[0]); setPendingCategory(""); }
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {/* Info banner */}
      <div className="mt-5 rounded-lg border bg-secondary/30 p-3 text-xs text-muted-foreground">
        <p><strong className="text-foreground">Sort order:</strong> use the ▲ ▼ buttons to control the order documents appear on the public Documents page. The topmost row appears first.</p>
        <p className="mt-1"><strong className="text-foreground">Popup:</strong> tick <em>Popup</em> to show a document automatically the first time a visitor opens the <strong>Home page</strong> (once per session). The <em>Pop#</em> number controls which popup appears first.</p>
      </div>

      {/* Document list */}
      <div className="mt-5 overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Column headers */}
        {docs && docs.length > 0 && (
          <div className="grid grid-cols-[28px_28px_1fr_120px_100px_90px_56px_36px_36px] items-center gap-2 border-b bg-secondary/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span></span>
            <span></span>
            <span>Title</span>
            <span>Category</span>
            <span>Size</span>
            <span>Popup</span>
            <span>Pop#</span>
            <span></span>
            <span></span>
          </div>
        )}

        {(docs as Doc[] ?? []).map((d, idx) => (
          <div
            key={d.id}
            className={`grid grid-cols-[28px_28px_1fr_120px_100px_90px_56px_36px_36px] items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-secondary/30 ${idx !== 0 ? "border-t" : ""}`}
          >
            {/* Drag handle (visual) */}
            <div className="flex cursor-grab items-center text-muted-foreground/40 hover:text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Move up / down */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => move(d.id, -1)}
                disabled={idx === 0}
                className="flex h-4 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary disabled:opacity-20"
                title="Move up"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => move(d.id, 1)}
                disabled={idx === (docs?.length ?? 0) - 1}
                className="flex h-4 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary disabled:opacity-20"
                title="Move down"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Title */}
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-accent" />
              <input
                defaultValue={d.title}
                onBlur={(e) => e.target.value !== d.title && updateField(d.id, "title", e.target.value)}
                className="min-w-0 flex-1 truncate rounded-md border-0 bg-transparent px-1.5 py-1 text-sm font-medium hover:bg-secondary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Category */}
            <input
              defaultValue={d.category ?? ""}
              list="cat-list"
              onBlur={(e) => updateField(d.id, "category", e.target.value)}
              placeholder="Category"
              className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {/* Size */}
            <span className="font-mono text-xs text-muted-foreground">{fmtSize(d.file_size_bytes)}</span>

            {/* Popup toggle */}
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs select-none">
              <input
                type="checkbox"
                defaultChecked={!!d.show_as_popup}
                onChange={async (e) => updateField(d.id, "show_as_popup", e.target.checked)}
                className="accent-primary"
              />
              Popup
            </label>

            {/* Popup order */}
            <input
              type="number"
              defaultValue={d.popup_sort_order ?? 0}
              onBlur={(e) => updateField(d.id, "popup_sort_order", Number(e.target.value) || 0)}
              title="Order popups appear in (lower = first)"
              className="w-full rounded-md border bg-background px-2 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {/* Preview */}
            <button
              onClick={() => setViewing({ url: d.file_url, title: d.title })}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </button>

            {/* Delete */}
            <button
              onClick={() => remove(d.id)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {(!docs || docs.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <FileText className="mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">No documents yet.</p>
            <p className="mt-1 text-sm">Upload a PDF using the button above.</p>
          </div>
        )}
      </div>

      <datalist id="cat-list">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>

      {/* Upload confirm dialog */}
      <Dialog open={!!pendingFile} onOpenChange={(v) => { if (!v) { setPendingFile(null); setPendingCategory(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Set category before uploading</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">File: <strong>{pendingFile?.name}</strong> ({fmtSize(pendingFile?.size ?? null)})</p>
          <label className="mt-2 block text-xs font-medium">Category <span className="text-muted-foreground">(pick existing or type a new one)</span></label>
          <input
            autoFocus
            list="cat-list-upload"
            value={pendingCategory}
            onChange={(e) => setPendingCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmUpload()}
            placeholder="e.g. Annual Report"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <datalist id="cat-list-upload">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button key={c} type="button" onClick={() => setPendingCategory(c)} className="rounded-full border bg-secondary px-2.5 py-1 text-xs hover:bg-accent/20">
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setPendingFile(null); setPendingCategory(""); }} className="rounded-md border px-3 py-1.5 text-sm">
              Cancel
            </button>
            <button onClick={confirmUpload} disabled={uploading} className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="flex h-[90vh] max-w-6xl flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 pr-8">
              <span className="truncate">{viewing?.title}</span>
              {viewing && (
                <a href={viewing.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-md border px-2 py-1 text-xs font-normal hover:bg-secondary">
                  Open in new tab
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <object data={viewing.url} type="application/pdf" className="min-h-0 flex-1 rounded-md border">
              <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewing.url)}&embedded=true`} className="h-full w-full rounded-md border" title={viewing.title} />
            </object>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
