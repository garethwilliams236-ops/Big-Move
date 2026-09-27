"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ErrorNote, PageHeader } from "@/components/PageHeader";

type Entry = {
  id: number;
  at: string;
  who: string | null;
  table_name: string;
  row_id: string | null;
  action: "added" | "changed" | "deleted";
  label: string | null;
  changes: Record<string, { from: unknown; to: unknown }> | Record<string, unknown> | null;
};

const AREAS: Record<string, string> = {
  tasks: "Task",
  possessions: "Possession",
  properties: "Property",
  budget_items: "Budget line",
  contacts: "Contact",
  members: "Household member",
};

const nice = (k: string) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const show = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : typeof v === "boolean" ? (v ? "yes" : "no") : String(v));

const actionCls = {
  added: "bg-emerald-100 text-emerald-800",
  changed: "bg-sky-100 text-sky-800",
  deleted: "bg-rose-100 text-rose-800",
};

export default function HistoryPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState("");
  const [who, setWho] = useState("");
  const [limit, setLimit] = useState(200);
  const [tick, setTick] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function reset(r: Entry) {
    const what = r.action === "changed" ? "put these fields back to their old values" : r.action === "deleted" ? "restore this deleted item" : "remove this added item";
    if (!window.confirm(`Reset: ${what}?\n\n${AREAS[r.table_name] ?? r.table_name}: ${r.label ?? ""}`)) return;
    setBusyId(r.id);
    const sb = supabaseBrowser();
    const key = r.table_name === "members" ? "email" : "id";
    let err: { message: string } | null = null;
    if (r.action === "changed") {
      const back = Object.fromEntries(Object.entries(r.changes as Record<string, { from: unknown }>).map(([k, v]) => [k, v?.from ?? null]));
      const { data, error } = await sb.from(r.table_name).update(back).eq(key, r.row_id).select(key);
      err = error ?? (data && data.length === 0 ? { message: "That item no longer exists — reset its deletion first." } : null);
    } else if (r.action === "deleted") {
      const old = { ...(r.changes as Record<string, unknown>) };
      delete old.updated_at;
      const { error } = await sb.from(r.table_name).insert(old);
      err = error && /duplicate/i.test(error.message) ? { message: "That item already exists again." } : error;
    } else {
      const { error } = await sb.from(r.table_name).delete().eq(key, r.row_id);
      err = error;
    }
    setBusyId(null);
    if (err) setError(err.message);
    else {
      setError(null);
      setTick((t) => t + 1);
    }
  }

  useEffect(() => {
    let q = supabaseBrowser().from("audit_log").select("*").order("at", { ascending: false }).limit(limit);
    if (area) q = q.eq("table_name", area);
    if (who) q = q.eq("who", who);
    q.then(({ data, error }: { data: Entry[] | null; error: { message: string } | null }) => {
      if (error) setError(error.message);
      else setRows(data ?? []);
      setLoading(false);
    });
  }, [area, who, limit, tick]);

  const people = [...new Set(rows.map((r) => r.who).filter(Boolean))] as string[];

  return (
    <>
      <PageHeader title="History" subtitle="Every addition, change and deletion — who did it and when" />
      <ErrorNote error={error} />
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input w-auto" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Everything</option>
          {Object.entries(AREAS).map(([k, v]) => <option key={k} value={k}>{v}s</option>)}
        </select>
        <select className="input w-auto" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="">Anyone</option>
          {[...new Set([...people, "Gareth", "Kristin"])].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="card p-6 text-center text-sm text-muted">No changes recorded yet.</div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {rows.map((r) => (
            <div key={r.id} className="px-3 py-2.5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`chip ${actionCls[r.action]}`}>{r.action}</span>
                <span className="text-muted">{AREAS[r.table_name] ?? r.table_name}</span>
                <b className="truncate">{r.label || "—"}</b>
                <span className="ml-auto text-xs text-muted whitespace-nowrap">
                  {r.who} ·{" "}
                  {new Date(r.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                {r.row_id && (r.action !== "deleted" || r.changes) && (
                  <button
                    className="btn-ghost !px-2 !py-1 text-xs text-brand"
                    disabled={busyId === r.id}
                    onClick={() => reset(r)}
                    title={r.action === "changed" ? "Put back the old values" : r.action === "deleted" ? "Restore this item" : "Remove this item"}
                  >
                    {busyId === r.id ? "…" : "↺ Reset"}
                  </button>
                )}
              </div>
              {r.action === "changed" && r.changes && (
                <ul className="mt-1 ml-1 text-xs text-muted space-y-0.5">
                  {Object.entries(r.changes as Record<string, { from: unknown; to: unknown }>).map(([k, v]) => (
                    <li key={k}>
                      {nice(k)}: <span className="line-through">{show(v?.from)}</span> → <span className="text-ink">{show(v?.to)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {rows.length >= limit && (
        <button className="btn-ghost mt-3" onClick={() => setLimit(limit + 200)}>Load more</button>
      )}
    </>
  );
}
