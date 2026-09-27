"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Member } from "@/lib/types";
import { ErrorNote, PageHeader } from "@/components/PageHeader";
import { useMe } from "@/components/Me";

export default function SettingsPage() {
  const me = useMe();
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabaseBrowser().from("members").select("email,name").order("created_at");
    if (error) setError(error.message);
    else setMembers(data as Member[]);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabaseBrowser().from("members").insert({ email: email.trim().toLowerCase(), name: name.trim() });
    if (error) setError(error.message);
    else { setEmail(""); setName(""); setError(null); load(); }
  }

  async function removeMember(m: Member) {
    if (m.email.toLowerCase() === me.email.toLowerCase()) return;
    if (!window.confirm(`Remove ${m.name}'s access?`)) return;
    const { error } = await supabaseBrowser().from("members").delete().eq("email", m.email);
    if (error) setError(error.message);
    load();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setPwMsg(error ? error.message : "Password updated.");
    setPw("");
  }

  return (
    <>
      <PageHeader title="Settings" />
      <ErrorNote error={error} />
      <div className="grid lg:grid-cols-2 gap-5 max-w-4xl">
        <section className="card p-4">
          <h2 className="font-semibold mb-1">Household</h2>
          <p className="text-sm text-muted mb-3">Everyone listed here sees and edits the same data. Add their email, then they create an account on the sign-in page with that email.</p>
          <ul className="divide-y divide-line mb-4">
            {members.map((m) => (
              <li key={m.email} className="flex items-center justify-between py-2 text-sm">
                <span><b>{m.name}</b> <span className="text-muted">{m.email}</span></span>
                {m.email.toLowerCase() !== me.email.toLowerCase() && (
                  <button className="btn-danger text-xs" onClick={() => removeMember(m)}>Remove</button>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={add} className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn-primary col-span-2">Add to household</button>
          </form>
        </section>
        <section className="card p-4">
          <h2 className="font-semibold mb-1">Your account</h2>
          <p className="text-sm text-muted mb-3">Signed in as {me.email}</p>
          <form onSubmit={changePassword} className="flex gap-2">
            <input className="input" type="password" minLength={8} placeholder="New password" required value={pw} onChange={(e) => setPw(e.target.value)} />
            <button className="btn-primary whitespace-nowrap">Change</button>
          </form>
          {pwMsg && <p className="text-sm text-muted mt-2">{pwMsg}</p>}
        </section>
      </div>
    </>
  );
}
