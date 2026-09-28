"use client";

import { useMemo, useState } from "react";
import { useTable } from "@/lib/useTable";
import type { Property } from "@/lib/types";
import { EditDialog, opts, type Field } from "@/components/EditDialog";
import { ErrorNote, PageHeader } from "@/components/PageHeader";
import { gbp, shortDate } from "@/lib/format";

const STATUS: Record<Property["status"], { label: string; cls: string }> = {
  shortlist: { label: "Shortlist", cls: "bg-black/5 text-muted" },
  viewing: { label: "Viewing booked", cls: "bg-sky-100 text-sky-800" },
  second_viewing: { label: "2nd viewing", cls: "bg-indigo-100 text-indigo-800" },
  offer: { label: "Offer made", cls: "bg-amber-100 text-amber-800" },
  agreed: { label: "Agreed", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Ruled out", cls: "bg-stone-200 text-stone-600" },
};

const fields: Field[] = [
  { key: "name", label: "Name / nickname", required: true },
  { key: "kind", label: "Type", type: "select", required: true, options: opts({ london: "London flat", country: "Country house" }), half: true },
  { key: "status", label: "Status", type: "select", required: true, options: opts(Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label]))), half: true },
  { key: "link", label: "Listing link", type: "hidden" },
  { key: "address", label: "Address", half: true },
  { key: "area", label: "Area / village", half: true },
  { key: "asking_price", label: "Asking price (£)", type: "number", half: true },
  { key: "sq_ft", label: "Size (sq ft)", type: "number", half: true },
  { key: "bedrooms", label: "Bedrooms", type: "number", half: true },
  { key: "bathrooms", label: "Bathrooms", type: "number", half: true },
  { key: "tenure", label: "Tenure", suggestions: ["Freehold", "Leasehold", "Share of freehold"], half: true },
  { key: "council_tax_band", label: "Council tax band", half: true },
  { key: "service_charge", label: "Service charge (£/yr)", type: "number", half: true },
  { key: "ground_rent", label: "Ground rent (£/yr)", type: "number", half: true },
  { key: "epc", label: "EPC rating", half: true },
  { key: "parking", label: "Parking", half: true },
  { key: "outside_space", label: "Outside space" },
  { key: "agent", label: "Agent", half: true },
  { key: "viewing_date", label: "Viewing date", type: "date", half: true },
  { key: "pros", label: "Pros", type: "textarea" },
  { key: "cons", label: "Cons", type: "textarea" },
  { key: "gareth_score", label: "Gareth's score (0-10)", type: "number", half: true },
  { key: "kristin_score", label: "Kristin's score (0-10)", type: "number", half: true },
  { key: "gareth_notes", label: "Gareth's notes", type: "textarea", half: true },
  { key: "kristin_notes", label: "Kristin's notes", type: "textarea", half: true },
];

const avg = (p: Property) => {
  const s = [p.gareth_score, p.kristin_score].filter((x): x is number => x != null);
  return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null;
};
const perSqFt = (p: Property) => (p.asking_price && p.sq_ft ? Math.round(p.asking_price / p.sq_ft) : null);

function ImportFromLink({ values, merge }: { values: Record<string, unknown>; merge: (v: Record<string, unknown>) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const link = (values.link as string) ?? "";

  async function run() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/property-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: link }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: json.error ?? "Couldn't fetch details." });
    const fields = json.fields as Record<string, unknown>;
    // Don't overwrite a name you've already typed
    if (values.name) delete fields.name;
    merge(fields);
    const n = Object.keys(fields).length;
    setMsg({ ok: n > 0, text: n ? `Filled ${n} fields — check them before saving.` : "Nothing found on that page." });
  }

  return (
    <div className="mb-4 rounded-xl bg-brand-soft/60 border border-brand/15 p-3">
      <label className="label">Listing link</label>
      <div className="flex gap-2">
        <input
          className="input"
          type="url"
          placeholder="Paste Rightmove, Zoopla or agent link…"
          value={link}
          onChange={(e) => merge({ link: e.target.value })}
        />
        <button type="button" className="btn-primary whitespace-nowrap" disabled={busy || !/^https?:\/\//.test(link)} onClick={run}>
          {busy ? "Reading…" : "Fetch details"}
        </button>
      </div>
      {busy && <p className="text-xs text-muted mt-1.5">Reading the listing — this can take 10–30 seconds.</p>}
      {msg && <p className={`text-xs mt-1.5 ${msg.ok ? "text-brand" : "text-danger"}`}>{msg.text}</p>}
    </div>
  );
}

export default function PropertiesPage() {
  const { rows, loading, error, save, remove } = useTable<Property>("properties", "created_at", false);
  const [kind, setKind] = useState<"london" | "country">("london");
  const [editing, setEditing] = useState<Property | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"cards" | "compare">("cards");
  const [showRejected, setShowRejected] = useState(false);
  const [sort, setSort] = useState<"score" | "price" | "newest">("score");

  const list = useMemo(() => {
    const l = rows.filter((p) => p.kind === kind && (showRejected || p.status !== "rejected"));
    if (sort === "score") l.sort((a, b) => (avg(b) ?? -1) - (avg(a) ?? -1));
    if (sort === "price") l.sort((a, b) => (a.asking_price ?? Infinity) - (b.asking_price ?? Infinity));
    return l;
  }, [rows, kind, showRejected, sort]);

  const compareRows: { label: string; get: (p: Property) => React.ReactNode }[] = [
    { label: "Status", get: (p) => <span className={`chip ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span> },
    { label: "Area", get: (p) => p.area ?? "—" },
    { label: "Price", get: (p) => gbp(p.asking_price) },
    { label: "Size", get: (p) => (p.sq_ft ? `${p.sq_ft.toLocaleString()} sq ft` : "—") },
    { label: "£ / sq ft", get: (p) => gbp(perSqFt(p)) },
    { label: "Beds / baths", get: (p) => `${p.bedrooms ?? "—"} / ${p.bathrooms ?? "—"}` },
    { label: "Tenure", get: (p) => p.tenure ?? "—" },
    { label: "Service charge", get: (p) => (p.service_charge != null ? `${gbp(p.service_charge)}/yr` : "—") },
    { label: "Council tax", get: (p) => p.council_tax_band ?? "—" },
    { label: "EPC", get: (p) => p.epc ?? "—" },
    { label: "Parking", get: (p) => p.parking ?? "—" },
    { label: "Outside", get: (p) => p.outside_space ?? "—" },
    { label: "Gareth", get: (p) => p.gareth_score ?? "—" },
    { label: "Kristin", get: (p) => p.kristin_score ?? "—" },
    { label: "Average", get: (p) => (avg(p) != null ? <b>{avg(p)!.toFixed(1)}</b> : "—") },
    { label: "Pros", get: (p) => <span className="whitespace-pre-line">{p.pros ?? "—"}</span> },
    { label: "Cons", get: (p) => <span className="whitespace-pre-line">{p.cons ?? "—"}</span> },
  ];

  return (
    <>
      <PageHeader title="Properties" subtitle="Shortlist, view and score options together">
        <button className="btn-primary" onClick={() => setAdding(true)}>+ Add property</button>
      </PageHeader>
      <ErrorNote error={error} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex rounded-lg border border-line overflow-hidden">
          {(["london", "country"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`px-3 py-1.5 text-sm ${kind === k ? "bg-brand text-white" : "bg-white"}`}>
              {k === "london" ? "London flat" : "Country house"} ({rows.filter((p) => p.kind === k && p.status !== "rejected").length})
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-line overflow-hidden">
          {(["cards", "compare"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm ${view === v ? "bg-ink text-white" : "bg-white"}`}>
              {v === "cards" ? "Cards" : "Compare"}
            </button>
          ))}
        </div>
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="score">Best scored</option>
          <option value="price">Lowest price</option>
          <option value="newest">Newest</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-muted">
          <input type="checkbox" checked={showRejected} onChange={(e) => setShowRejected(e.target.checked)} /> Show ruled out
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : list.length === 0 ? (
        <div className="card p-6 text-center text-sm text-muted">No {kind === "london" ? "London flats" : "country properties"} yet. Paste in a listing to start.</div>
      ) : view === "cards" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((p) => (
            <button key={p.id} onClick={() => setEditing(p)} className="card p-4 text-left hover:shadow-md transition-shadow flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted">{[p.area, p.address].filter(Boolean).join(" · ") || "—"}</div>
                </div>
                <span className={`chip shrink-0 ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
              </div>
              <div className="text-xl font-semibold">{gbp(p.asking_price)}</div>
              <div className="text-xs text-muted">
                {[
                  p.bedrooms != null && `${p.bedrooms} bed`,
                  p.bathrooms != null && `${p.bathrooms} bath`,
                  p.sq_ft && `${p.sq_ft.toLocaleString()} sq ft`,
                  perSqFt(p) && `${gbp(perSqFt(p))}/sq ft`,
                  p.tenure,
                ].filter(Boolean).join(" · ")}
              </div>
              <div className="flex gap-3 text-sm mt-auto pt-2 border-t border-line">
                <span>G <b>{p.gareth_score ?? "–"}</b></span>
                <span>K <b>{p.kristin_score ?? "–"}</b></span>
                {avg(p) != null && <span className="text-brand font-semibold ml-auto">{avg(p)!.toFixed(1)} / 10</span>}
              </div>
              {p.viewing_date && <div className="text-xs text-accent">Viewing {shortDate(p.viewing_date)}</div>}
              {p.link && (
                <a href={p.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-brand underline">
                  Open listing ↗
                </a>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="text-sm min-w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky left-0 bg-card p-2 text-left text-xs text-muted font-medium w-32" />
                {list.map((p) => (
                  <th key={p.id} className="p-2 text-left min-w-44 align-bottom">
                    <button className="font-semibold hover:underline text-left" onClick={() => setEditing(p)}>{p.name}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((r) => (
                <tr key={r.label} className="border-b border-line last:border-0 align-top">
                  <td className="sticky left-0 bg-card p-2 text-xs text-muted font-medium">{r.label}</td>
                  {list.map((p) => <td key={p.id} className="p-2">{r.get(p)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditDialog
        open={adding || !!editing}
        title={editing ? "Edit property" : "New property"}
        fields={fields}
        initial={editing ?? { name: "", kind, status: "shortlist" }}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(v) => save(v as Partial<Property>, editing?.id)}
        onDelete={editing ? () => remove(editing.id) : undefined}
        topSlot={(values, merge) => <ImportFromLink values={values} merge={merge} />}
      />
    </>
  );
}
