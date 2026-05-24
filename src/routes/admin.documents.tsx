import { AdminSpecs, SPECS } from "@/components/AdminSpecs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Trash2, Eye, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/documents")({ component: AdminDocs });

function AdminDocs() {
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<{ url: string; title: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingCategory, setPendingCategory] = useState("");
  const { data: docs } = useQuery({
    queryKey: ["admin-docs"],
    queryFn: async () => (await supabase.from("documents").select("*").order("uploaded_at", { ascending: false })).data ?? [],
  });

  const categories = Array.from(new Set((docs ?? []).map((d) => d.category).filter(Boolean))) as string[];

  async function confirmUpload() {
    if (!pendingFile) return;
    const file = pendingFile;
    const category = pendingCategory.trim() || "General";
    if (file.size > 50 * 1024 * 1024) { toast.error("Max 50MB"); return; }
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    const { error } = await supabase.from("documents").insert({ title: file.name, file_url: data.publicUrl, file_size_bytes: file.size, category });
    setUploading(false);
    setPendingFile(null);
    setPendingCategory("");
    if (error) toast.error(error.message);
    else { toast.success("Uploaded"); qc.invalidateQueries({ queryKey: ["admin-docs"] }); }
  }

  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-docs"] });
  }
  async function updateTitle(id: string, title: string) {
    await supabase.from("documents").update({ title }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-docs"] });
  }
  async function toggleCategory(id: string, category: string) {
    await supabase.from("documents").update({ category }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-docs"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div><div className="flex items-center gap-3"><h1 className="font-display text-3xl font-bold">Documents</h1><AdminSpecs items={SPECS.document} /></div><p className="text-muted-foreground">Upload PDFs and files.</p></div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Upload className="h-4 w-4" />{uploading ? "Uploading..." : "Choose file"}
          <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { setPendingFile(e.target.files[0]); setPendingCategory(""); } e.target.value = ""; }} />
        </label>
      </div>

      <div className="mt-6 rounded-lg border bg-secondary/30 p-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Popup on first visit:</strong> tick "Popup" to show a document automatically the first time a visitor opens the Documents page (once per browser session). If multiple are ticked, the lower <strong>Order</strong> number is shown first.
      </div>

      <div className="mt-4 space-y-2">
        {docs?.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
            <FileText className="h-5 w-5 text-accent" />
            <input defaultValue={d.title} onBlur={(e) => e.target.value !== d.title && updateTitle(d.id, e.target.value)} className="min-w-[12rem] flex-1 rounded-md border-0 bg-transparent px-2 py-1 text-sm font-medium hover:bg-secondary focus:bg-background focus:ring-1" />
            <input defaultValue={d.category ?? ""} list="cat-list" onBlur={(e) => toggleCategory(d.id, e.target.value)} placeholder="Category" className="w-36 rounded-md border bg-background px-2 py-1 text-xs" />
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs" title="Show this document as a popup the first time a visitor opens the Documents page">
              <input
                type="checkbox"
                defaultChecked={!!(d as any).show_as_popup}
                onChange={async (e) => {
                  await supabase.from("documents").update({ show_as_popup: e.target.checked }).eq("id", d.id);
                  qc.invalidateQueries({ queryKey: ["admin-docs"] });
                }}
              />
              Popup
            </label>
            <input
              type="number"
              defaultValue={(d as any).popup_sort_order ?? 0}
              onBlur={async (e) => {
                await supabase.from("documents").update({ popup_sort_order: Number(e.target.value) || 0 }).eq("id", d.id);
                qc.invalidateQueries({ queryKey: ["admin-docs"] });
              }}
              title="Order popups appear in (lower = first)"
              className="w-16 rounded-md border bg-background px-2 py-1 text-xs"
            />
            <button onClick={() => setViewing({ url: d.file_url, title: d.title })} className="rounded-md p-2 hover:bg-secondary"><Eye className="h-4 w-4" /></button>
            <button onClick={() => remove(d.id)} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {(!docs || docs.length === 0) && <p className="py-8 text-center text-muted-foreground">No documents yet.</p>}
      </div>

      <datalist id="cat-list">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>

      <Dialog open={!!pendingFile} onOpenChange={(v) => { if (!v) { setPendingFile(null); setPendingCategory(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Choose category</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">File: <strong>{pendingFile?.name}</strong></p>
          <label className="mt-2 block text-xs font-medium">Category (pick existing or type a new one)</label>
          <input
            autoFocus
            list="cat-list-upload"
            value={pendingCategory}
            onChange={(e) => setPendingCategory(e.target.value)}
            placeholder="e.g. Annual Report"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <datalist id="cat-list-upload">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button key={c} type="button" onClick={() => setPendingCategory(c)} className="rounded-full border bg-secondary px-2.5 py-1 text-xs hover:bg-accent/20">{c}</button>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setPendingFile(null); setPendingCategory(""); }} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={confirmUpload} disabled={uploading} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{uploading ? "Uploading..." : "Upload"}</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="flex h-[90vh] max-w-6xl flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 pr-8">
              <span className="truncate">{viewing?.title}</span>
              {viewing && (
                <a href={viewing.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-md border px-2 py-1 text-xs font-normal hover:bg-secondary">Open in new tab</a>
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
