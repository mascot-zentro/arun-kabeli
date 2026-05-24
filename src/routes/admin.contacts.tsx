import { AdminSpecs, SPECS } from "@/components/AdminSpecs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, MailOpen, Download } from "lucide-react";

export const Route = createFileRoute("/admin/contacts")({ component: AdminContacts });

function csvEscape(v: any) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function AdminContacts() {
  const qc = useQueryClient();
  const { data: items } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => (await supabase.from("contact_submissions").select("*").order("submitted_at", { ascending: false })).data ?? [],
  });
  async function markRead(id: string) {
    await supabase.from("contact_submissions").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-contacts"] });
  }
  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    await supabase.from("contact_submissions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-contacts"] });
  }
  function exportCsv() {
    if (!items) return;
    const headers = ["name", "email", "subject", "message", "submitted_at", "is_read"];
    const rows = [headers.join(","), ...items.map((r) => headers.map((h) => csvEscape((r as any)[h])).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contacts-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast.success("Exported");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-3xl font-bold">Contact Submissions</h1><p className="text-muted-foreground">{items?.length ?? 0} total</p></div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Download className="h-4 w-4" />Export CSV</button>
      </div>

      <div className="mt-8 space-y-3">
        {items?.map((r) => (
          <div key={r.id} className={`rounded-xl border bg-card p-5 ${!r.is_read ? "border-accent" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2"><span className="font-semibold">{r.name}</span>{!r.is_read && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs">New</span>}</div>
                <a href={`mailto:${r.email}`} className="text-sm text-accent hover:underline">{r.email}</a>
                <p className="text-xs text-muted-foreground">{new Date(r.submitted_at!).toLocaleString()} {r.subject ? `· ${r.subject}` : ""}</p>
              </div>
              <div className="flex gap-2">
                {!r.is_read && <button onClick={() => markRead(r.id)} className="rounded-md p-2 hover:bg-secondary" title="Mark read"><MailOpen className="h-4 w-4" /></button>}
                <button onClick={() => remove(r.id)} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{r.message}</p>
          </div>
        ))}
        {(!items || items.length === 0) && <p className="py-8 text-center text-muted-foreground">No submissions yet.</p>}
      </div>
    </div>
  );
}
