import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/admin/password")({ component: AdminPassword });

function AdminPassword() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (next !== confirm) { toast.error("Passwords do not match"); return; }
    if (!user?.email) { toast.error("No active session"); return; }
    setBusy(true);
    // Re-authenticate to verify the current password
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (signInErr) { toast.error("Current password is incorrect"); setBusy(false); return; }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setCurrent(""); setNext(""); setConfirm(""); }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3">
        <KeyRound className="h-6 w-6 text-accent" />
        <h1 className="font-display text-3xl font-bold">Change Password</h1>
      </div>
      <p className="mt-2 text-muted-foreground">Signed in as <strong>{user?.email}</strong></p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border bg-card p-6">
        <div>
          <label className="text-sm font-medium">Current password</label>
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">New password</label>
          <input type="password" required minLength={6} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-muted-foreground">At least 6 characters.</p>
        </div>
        <div>
          <label className="text-sm font-medium">Confirm new password</label>
          <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Updating..." : "Update password"}</button>
      </form>
    </div>
  );
}
