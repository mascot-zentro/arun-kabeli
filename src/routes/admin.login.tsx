import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logo from "@/assets/logo.webp";

export const Route = createFileRoute("/admin/login")({
  component: Login,
});

function Login() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.navigate({ to: "/admin/dashboard" });
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else toast.success("Welcome back");
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin/login` } });
      if (error) toast.error(error.message);
      else toast.success("Account created. The first registered user becomes admin.");
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center animated-mesh px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
        <div className="flex flex-col items-center">
          <img src={logo} alt="logo" className="h-16 w-16 rounded-full bg-white/95 p-1" />
          <h1 className="mt-4 font-display text-2xl font-bold">Admin {mode === "signin" ? "Sign in" : "Sign up"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Arun Kabeli Power CMS</p>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="text-sm font-medium">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
          <div><label className="text-sm font-medium">Password</label><input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
          <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-accent">
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
