import { AdminSpecs, SPECS } from "@/components/AdminSpecs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/team")({ component: AdminTeam });

type Member = {
  id?: string;
  name: string;
  role: string | null;
  department: string | null;
  bio: string | null;
  message: string | null;
  photo_url: string | null;
  sort_order: number | null;
  is_visible: boolean | null;
};

function AdminTeam() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Partial<Member> | null>(null);
  const { data: members } = useQuery({
    queryKey: ["admin-team"],
    queryFn: async () =>
      (await supabase.from("team_members").select("*").order("sort_order")).data ?? [],
  });

  async function save(m: Partial<Member>) {
    const payload = {
      name: m.name!,
      role: m.role ?? null,
      department: m.department ?? null,
      bio: m.bio ?? null,
      message: m.message ?? null,
      photo_url: m.photo_url ?? null,
      sort_order: m.sort_order ?? 0,
      is_visible: m.is_visible ?? true,
    };
    const { error } = m.id
      ? await supabase.from("team_members").update(payload).eq("id", m.id)
      : await supabase.from("team_members").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["admin-team"] });
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    await supabase.from("team_members").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-team"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">Team</h1>
            <AdminSpecs items={SPECS.teamPhoto} />
          </div>
          <p className="text-muted-foreground">Manage team members.</p>
        </div>
        <button
          onClick={() => setEdit({ name: "", sort_order: 0, is_visible: true } as any)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {members?.map((m) => (
          <div key={m.id} className="rounded-xl border bg-card p-4">
            <div className="aspect-square overflow-hidden rounded-full bg-muted">
              {m.photo_url ? (
                <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />
              )}
            </div>
            <h3 className="mt-3 font-display text-lg font-bold">{m.name}</h3>
            <p className="text-sm font-medium text-muted-foreground">{m.role}</p>
            {m.department && (
              <p className="text-xs text-muted-foreground">{m.department}</p>
            )}
            {m.message && (
              <p className="mt-2 text-xs italic text-muted-foreground line-clamp-2">
                &ldquo;{m.message}&rdquo;
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {m.is_visible ? "Visible" : "Hidden"} &middot; #{m.sort_order}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setEdit(m as any)}
                className="flex-1 rounded-md border py-1.5 text-xs hover:bg-secondary"
              >
                <Pencil className="mx-auto h-3 w-3" />
              </button>
              <button
                onClick={() => remove(m.id)}
                className="flex-1 rounded-md border py-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mx-auto h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {(!members || members.length === 0) && (
          <p className="col-span-full py-8 text-center text-muted-foreground">
            No team members yet.
          </p>
        )}
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit" : "New"} team member</DialogTitle>
          </DialogHeader>
          {edit && <TeamForm initial={edit} onSave={save} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamForm({
  initial,
  onSave,
}: {
  initial: Partial<Member>;
  onSave: (m: Partial<Member>) => void;
}) {
  const [m, setM] = useState<Partial<Member>>(initial);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("team-photos").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("team-photos").getPublicUrl(path);
    setM({ ...m, photo_url: data.publicUrl });
    setUploading(false);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(m);
      }}
      className="space-y-3 text-sm"
    >
      <label className="block">
        <span className="font-medium">Name</span>
        <input
          required
          value={m.name ?? ""}
          onChange={(e) => setM({ ...m, name: e.target.value })}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="font-medium">Role</span>
          <input
            value={m.role ?? ""}
            onChange={(e) => setM({ ...m, role: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label>
          <span className="font-medium">Department</span>
          <input
            value={m.department ?? ""}
            onChange={(e) => setM({ ...m, department: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
      </div>

      <label className="block">
        <span className="font-medium">Bio</span>
        <textarea
          rows={3}
          value={m.bio ?? ""}
          onChange={(e) => setM({ ...m, bio: e.target.value })}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="font-medium">Message</span>
        <span className="ml-2 text-xs text-muted-foreground">
          Personal quote or message shown on their card
        </span>
        <textarea
          rows={2}
          placeholder='e.g. "Passionate about building great products."'
          value={m.message ?? ""}
          onChange={(e) => setM({ ...m, message: e.target.value })}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
        />
      </label>

      <div>
        <span className="font-medium">Photo</span>
        {m.photo_url && (
          <img src={m.photo_url} alt="" className="my-2 h-24 w-24 rounded-full object-cover" />
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2">
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
            value={m.sort_order ?? 0}
            onChange={(e) => setM({ ...m, sort_order: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label className="flex items-end gap-2">
          <input
            type="checkbox"
            checked={m.is_visible ?? true}
            onChange={(e) => setM({ ...m, is_visible: e.target.checked })}
          />
          <span>Visible</span>
        </label>
      </div>

      <button className="w-full rounded-md bg-primary py-2 font-semibold text-primary-foreground">
        Save
      </button>
    </form>
  );
}
