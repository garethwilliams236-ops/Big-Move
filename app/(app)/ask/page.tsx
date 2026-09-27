"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/types";
import { ErrorNote, PageHeader } from "@/components/PageHeader";
import { useMe } from "@/components/Me";

const SUGGESTIONS = [
  "What should we be doing this month?",
  "How much SDLT would we pay on a £1.2m London flat plus a £600k country house?",
  "What questions should we ask when viewing a leasehold flat?",
  "Which of our possessions are still undecided, and how should we approach them?",
  "Compare our shortlisted properties.",
];

function Formatted({ text }: { text: string }) {
  // Light formatting: **bold**, and keep line breaks
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>))}
    </div>
  );
}

export default function AskPage() {
  const me = useMe();
  const [threads, setThreads] = useState<string[]>(["Gareth", "Kristin"]);
  const [thread, setThread] = useState(me.name || "Gareth");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeData, setIncludeData] = useState(true);
  const bottom = useRef<HTMLDivElement>(null);

  async function load(t = thread) {
    const { data, error } = await supabaseBrowser().from("chat_messages").select("*").eq("thread", t).order("created_at").limit(200);
    if (error) setError(error.message);
    else setMessages(data as ChatMessage[]);
  }
  useEffect(() => {
    supabaseBrowser()
      .from("members")
      .select("name")
      .order("created_at")
      .then(({ data }: { data: { name: string }[] | null }) => {
        const names = (data ?? []).map((m: { name: string }) => m.name);
        setThreads([...new Set([...names, "Gareth", "Kristin"])]);
      });
  }, []);
  useEffect(() => { setMessages([]); load(thread); }, [thread]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    setQ("");
    setMessages((m) => [...m, { id: "pending", role: "user", content: text, author: me.name || "You", thread, created_at: new Date().toISOString() }]);
    const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text, includeData, thread }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error ?? "Something went wrong");
    await load();
    setBusy(false);
  }

  async function clear() {
    if (!window.confirm(`Clear ${thread}'s conversation?`)) return;
    await supabaseBrowser().from("chat_messages").delete().eq("thread", thread);
    load();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)]">
      <PageHeader title="Ask Claude" subtitle="Separate conversations for each of you — both can read either">
        {messages.length > 0 && <button className="btn-ghost text-muted" onClick={clear}>Clear</button>}
      </PageHeader>
      <div className="flex gap-1 mb-4 border-b border-line">
        {threads.map((t) => (
          <button
            key={t}
            onClick={() => setThread(t)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${thread === t ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <ErrorNote error={error} />

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && !busy && (
          <div className="space-y-2">
            <p className="text-sm text-muted">Try one of these:</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="block text-left card px-3 py-2 text-sm hover:border-brand">{s}</button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-brand text-white" : "card"}`}>
              <div className={`text-xs mb-0.5 ${m.role === "user" ? "text-white/70" : "text-muted"}`}>{m.author}</div>
              <Formatted text={m.content} />
            </div>
          </div>
        ))}
        {busy && <div className="card inline-block px-4 py-2.5 text-sm text-muted">Claude is thinking…</div>}
        <div ref={bottom} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(q); }} className="border-t border-line pt-3">
        <div className="flex gap-2">
          <textarea
            className="input min-h-11 max-h-40 resize-y"
            rows={1}
            placeholder={thread === me.name ? "Ask anything about the move…" : `Add to ${thread}'s conversation…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(q); } }}
          />
          <button className="btn-primary" disabled={busy || !q.trim()}>Send</button>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted mt-2">
          <input type="checkbox" checked={includeData} onChange={(e) => setIncludeData(e.target.checked)} />
          Let Claude see our tasks, possessions, properties and budget
        </label>
      </form>
    </div>
  );
}
