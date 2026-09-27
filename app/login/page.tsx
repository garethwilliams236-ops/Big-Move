"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = supabaseBrowser();
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else {
        router.replace("/");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setMsg(error.message);
      else if (data.session) {
        router.replace("/");
        router.refresh();
      } else setMsg("Check your email to confirm your account, then sign in.");
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 size-12 rounded-xl bg-brand grid place-items-center text-white text-xl">⌂</div>
          <h1 className="h1">Big Move</h1>
          <p className="text-sm text-muted">Fulham → London flat + country home, by March 2027</p>
        </div>
        <form onSubmit={submit} className="card p-5 space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {msg && <p className="text-sm text-danger">{msg}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            className="btn-ghost w-full text-muted"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }}
          >
            {mode === "signin" ? "First time? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
