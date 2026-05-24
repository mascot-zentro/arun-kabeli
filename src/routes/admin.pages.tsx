import { AdminSpecs, SPECS } from "@/components/AdminSpecs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/pages")({ component: AdminPages });

function AdminPages() {
  const qc = useQueryClient();
  const [newKey, setNewKey] = useState("");
  const { data: sections } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => (await supabase.from("page_content").select("*").order("section_key")).data ?? [],
  });

  async function create() {
    if (!newKey) return;
    const { error } = await supabase.from("page_content").insert({ section_key: newKey, content_json: {} });
    if (error) toast.error(error.message);
    else { setNewKey(""); qc.invalidateQueries({ queryKey: ["admin-pages"] }); }
  }
  async function save(id: string, json: string) {
    try {
      const parsed = JSON.parse(json);
      const { error } = await supabase.from("page_content").update({ content_json: parsed }).eq("id", id);
      if (error) toast.error(error.message); else toast.success("Saved");
    } catch { toast.error("Invalid JSON"); }
  }
  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    await supabase.from("page_content").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-pages"] });
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Page Content</h1>
      <p className="text-muted-foreground">Edit reusable JSON content blocks (e.g. <code className="font-mono text-xs">home.hero</code>, <code className="font-mono text-xs">about.story</code>).</p>

      <div className="mt-6 flex gap-2">
        <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="section_key (e.g. home.hero)" className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono" />
        <button onClick={create} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Add section</button>
      </div>

      <div className="mt-8 space-y-4">
        {sections?.map((s) => <Section key={s.id} section={s} onSave={save} onRemove={remove} />)}
        {(!sections || sections.length === 0) && <p className="py-8 text-center text-muted-foreground">No sections yet.</p>}
      </div>
    </div>
  );
}

function Section({ section, onSave, onRemove }: { section: any; onSave: (id: string, json: string) => void; onRemove: (id: string) => void }) {
  const [val, setVal] = useState(JSON.stringify(section.content_json, null, 2));
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <code className="font-mono text-sm font-bold text-accent">{section.section_key}</code>
        <div className="flex gap-2">
          <button onClick={() => onSave(section.id, val)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"><Save className="h-3 w-3" />Save</button>
          <button onClick={() => onRemove(section.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>
      <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={6} className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs" />
    </div>
  );
}
