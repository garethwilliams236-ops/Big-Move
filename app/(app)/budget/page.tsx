"use client";

import { useState } from "react";
import { useTable } from "@/lib/useTable";
import type { BudgetItem } from "@/lib/types";
import { EditDialog, opts, type Field } from "@/components/EditDialog";
import { ErrorNote, PageHeader } from "@/components/PageHeader";
import { gbp } from "@/lib/format";

const SECTIONS: BudgetItem["section"][] = ["Sale proceeds", "London purchase", "Country purchase", "Moving costs", "Storage", "Other"];

const fields: Field[] = [
  { key: "label", label: "Item", required: true },
  { key: "section", label: "Section", type: "select", required: true, options: opts(SECTIONS), half: true },
  { key: "direction", label: "Money", type: "select", required: true, options: opts({ in: "Coming in", out: "Going out" }), half: true },
  { key: "estimate", label: "Estimate (£)", type: "number", half: true },
  { key: "actual", label: "Actual (£)", type: "number", half: true },
  { key: "notes", label: "Notes", type: "textarea" },
];

const val = (b: BudgetItem, which: "estimate" | "actual") => {
  const v = which === "actual" ? (b.actual ?? b.estimate) : b.estimate;
  return (v ?? 0) * (b.direction === "in" ? 1 : -1);
};

export default function BudgetPage() {
  const { rows, loading, error, save, remove } = useTable<BudgetItem>("budget_items", "created_at");
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [adding, setAdding] = useState<BudgetItem["section"] | null>(null);

  const net = (which: "estimate" | "actual") => rows.reduce((s, b) => s + val(b, which), 0);
  const inflow = rows.filter((b) => b.direction === "in").reduce((s, b) => s + (b.actual ?? b.estimate ?? 0), 0);
  const outflow = rows.filter((b) => b.direction === "out").reduce((s, b) => s + (b.actual ?? b.estimate ?? 0), 0);

  return (
    <>
      <PageHeader title="Budget" subtitle="Sale proceeds against the two purchases and moving costs">
        <button className="btn-primary" onClick={() => setAdding("Other")}>+ Add line</button>
      </PageHeader>
      <ErrorNote error={error} />

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="card p-4">
          <div className="text-xs text-muted">Money in</div>
          <div className="text-2xl font-semibold text-brand">{gbp(inflow)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Money out</div>
          <div className="text-2xl font-semibold text-accent">{gbp(outflow)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Headroom (actual where known, else estimate)</div>
          <div className={`text-2xl font-semibold ${net("actual") < 0 ? "text-danger" : ""}`}>{gbp(net("actual"))}</div>
          <div className="text-xs text-muted">Estimate only: {gbp(net("estimate"))}</div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="space-y-5">
          {SECTIONS.map((sec) => {
            const items = rows.filter((b) => b.section === sec);
            if (!items.length && sec === "Other") return null;
            const total = items.reduce((s, b) => s + val(b, "actual"), 0);
            return (
              <section key={sec}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{sec}</h2>
                  <button className="btn-ghost text-xs" onClick={() => setAdding(sec)}>+ Add</button>
                </div>
                <div className="card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted border-b border-line">
                        <th className="text-left font-medium p-2">Item</th>
                        <th className="text-right font-medium p-2">Estimate</th>
                        <th className="text-right font-medium p-2">Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((b) => (
                        <tr key={b.id} className="border-b border-line last:border-0 hover:bg-black/[0.02] cursor-pointer" onClick={() => setEditing(b)}>
                          <td className="p-2">
                            <span className={b.direction === "in" ? "text-brand" : ""}>{b.direction === "in" ? "+ " : "− "}</span>
                            {b.label}
                            {b.notes && <div className="text-xs text-muted">{b.notes}</div>}
                          </td>
                          <td className="p-2 text-right tabular-nums">{gbp(b.estimate)}</td>
                          <td className="p-2 text-right tabular-nums">{gbp(b.actual)}</td>
                        </tr>
                      ))}
                      <tr className="bg-black/[0.02] font-medium">
                        <td className="p-2">Net</td>
                        <td />
                        <td className={`p-2 text-right tabular-nums ${total < 0 ? "text-accent" : "text-brand"}`}>{gbp(total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <EditDialog
        open={!!adding || !!editing}
        title={editing ? "Edit line" : "New budget line"}
        fields={fields}
        initial={editing ?? { label: "", section: adding ?? "Other", direction: adding === "Sale proceeds" ? "in" : "out" }}
        onClose={() => { setAdding(null); setEditing(null); }}
        onSave={(v) => save(v as Partial<BudgetItem>, editing?.id)}
        onDelete={editing ? () => remove(editing.id) : undefined}
      />
    </>
  );
}
