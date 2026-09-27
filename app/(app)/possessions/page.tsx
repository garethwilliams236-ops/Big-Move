"use client";

import { useMemo, useState } from "react";
import { useTable } from "@/lib/useTable";
import type { Possession } from "@/lib/types";
import { EditDialog, opts, type Field } from "@/components/EditDialog";
import { ErrorNote, PageHeader } from "@/components/PageHeader";
import { DESTINATIONS, P_CATEGORIES, P_STATUS, ROOMS } from "@/lib/possessionMeta";
import { gbp } from "@/lib/format";

const fields: Field[] = [
  { key: "name", label: "Item", required: true },
  { key: "room", label: "Room (now)", suggestions: ROOMS, required: true, half: true },
  { key: "category", label: "Category", suggestions: P_CATEGORIES, required: true, half: true },
  { key: "destination", label: "Where it's going", type: "select", required: true, options: opts(Object.fromEntries(Object.entries(DESTINATIONS).map(([k, v]) => [k, v.label]))), half: true },
  { key: "status", label: "Status", type: "select", required: true, options: opts(P_STATUS), half: true },
  { key: "box_label", label: "Box / label", placeholder: "e.g. K-04", half: true },
  { key: "quantity", label: "Quantity", type: "number", half: true },
  { key: "size", label: "Size", type: "select", options: opts({ small: "Small", medium: "Medium", large: "Large", furniture: "Furniture" }), half: true },
  { key: "est_value", label: "Est. value (£)", type: "number", half: true },
  { key: "fragile", label: "Fragile", type: "checkbox" },
  { key: "notes", label: "Notes", type: "textarea" },
];

const blank = { name: "", room: "Living room", category: "General", destination: "undecided", status: "in_place", quantity: 1, fragile: false };

export default function PossessionsPage() {
  const { rows, loading, error, save, remove } = useTable<Possession>("possessions", "name");
  const [editing, setEditing] = useState<Possession | null>(null);
  const [adding, setAdding] = useState(false);
  const [dest, setDest] = useState("");
  const [room, setRoom] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [lastRoom, setLastRoom] = useState("Living room");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of rows) c[p.destination] = (c[p.destination] ?? 0) + p.quantity;
    return c;
  }, [rows]);

  const rooms = useMemo(() => [...new Set(rows.map((r) => r.room))].sort(), [rows]);

  const filtered = rows.filter(
    (p) =>
      (!dest || p.destination === dest) &&
      (!room || p.room === room) &&
      (!status || p.status === status) &&
      (!q || `${p.name} ${p.box_label ?? ""} ${p.notes ?? ""}`.toLowerCase().includes(q.toLowerCase())),
  );

  const grouped = useMemo(() => {
    const m = new Map<string, Possession[]>();
    for (const p of filtered) {
      if (!m.has(p.room)) m.set(p.room, []);
      m.get(p.room)!.push(p);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const packed = rows.filter((p) => p.status !== "in_place").length;
  const valueToSell = rows.filter((p) => p.destination === "sell").reduce((s, p) => s + (p.est_value ?? 0) * p.quantity, 0);

  return (
    <>
      <PageHeader title="Possessions" subtitle={`${rows.length} items · ${packed} packed or moved · ${gbp(valueToSell)} to sell`}>
        <button className="btn-primary" onClick={() => setAdding(true)}>+ Add item</button>
      </PageHeader>
      <ErrorNote error={error} />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-5">
        {Object.entries(DESTINATIONS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setDest(dest === k ? "" : k)}
            className={`card p-3 text-left ${dest === k ? "ring-2 ring-brand" : ""}`}
          >
            <div className="text-xl font-semibold">{counts[k] ?? 0}</div>
            <span className={`chip ${v.cls}`}>{v.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input className="input max-w-48" placeholder="Search items or box…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={room} onChange={(e) => setRoom(e.target.value)}>
          <option value="">All rooms</option>
          {rooms.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          {Object.entries(P_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : grouped.length === 0 ? (
        <div className="card p-6 text-center text-sm text-muted">
          No items yet. Walk round the house room by room and add what you have — then tag where each thing is going.
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([r, items]) => (
            <section key={r}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">{r} ({items.length})</h2>
              <div className="card divide-y divide-line overflow-hidden">
                {items.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                    <button className="flex-1 min-w-40 text-left" onClick={() => setEditing(p)}>
                      <div className="text-sm">
                        {p.name}
                        {p.quantity > 1 && <span className="text-muted"> ×{p.quantity}</span>}
                        {p.fragile && <span className="ml-1 text-xs text-accent">fragile</span>}
                      </div>
                      <div className="text-xs text-muted">
                        {p.category}
                        {p.box_label && ` · Box ${p.box_label}`}
                        {p.est_value != null && ` · ${gbp(p.est_value)}`}
                      </div>
                    </button>
                    <select
                      className={`chip border-0 cursor-pointer ${DESTINATIONS[p.destination].cls}`}
                      value={p.destination}
                      onChange={(e) => save({ destination: e.target.value as Possession["destination"] }, p.id)}
                    >
                      {Object.entries(DESTINATIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <select
                      className="chip border-0 cursor-pointer bg-black/5 text-muted"
                      value={p.status}
                      onChange={(e) => save({ status: e.target.value as Possession["status"] }, p.id)}
                    >
                      {Object.entries(P_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <EditDialog
        open={adding || !!editing}
        title={editing ? "Edit item" : "New item"}
        fields={fields}
        initial={editing ?? { ...blank, room: lastRoom }}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={async (v) => {
          setLastRoom(String(v.room ?? lastRoom));
          return save(v as Partial<Possession>, editing?.id);
        }}
        onDelete={editing ? () => remove(editing.id) : undefined}
      />
    </>
  );
}
