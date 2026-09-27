"use client";

import { useEffect, useState } from "react";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "time" | "select" | "checkbox" | "url";
  options?: { value: string; label: string }[];
  required?: boolean;
  half?: boolean;
  placeholder?: string;
  suggestions?: string[];
};

type Values = Record<string, unknown>;

export function EditDialog({
  open,
  title,
  fields,
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  title: string;
  fields: Field[];
  initial: Values;
  onClose: () => void;
  onSave: (values: Values) => Promise<boolean>;
  onDelete?: () => Promise<void>;
}) {
  const [values, setValues] = useState<Values>(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const out: Values = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.type === "number") out[f.key] = v === "" || v == null ? null : Number(v);
      else if (f.type === "checkbox") out[f.key] = !!v;
      else out[f.key] = v === "" || v === undefined ? null : v;
    }
    const ok = await onSave(out);
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => {
            const v = values[f.key];
            const cls = f.half ? "col-span-2 sm:col-span-1" : "col-span-2";
            if (f.type === "checkbox")
              return (
                <label key={f.key} className={`${cls} flex items-center gap-2 text-sm`}>
                  <input type="checkbox" checked={!!v} onChange={(e) => set(f.key, e.target.checked)} />
                  {f.label}
                </label>
              );
            return (
              <div key={f.key} className={cls}>
                <label className="label">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea className="input min-h-20" value={(v as string) ?? ""} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
                ) : f.type === "select" ? (
                  <select className="input" value={(v as string) ?? ""} required={f.required} onChange={(e) => set(f.key, e.target.value)}>
                    {!f.required && <option value="">—</option>}
                    {f.options!.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    type={f.type ?? "text"}
                    required={f.required}
                    placeholder={f.placeholder}
                    step={f.type === "number" ? "any" : undefined}
                    value={v == null ? "" : String(v)}
                    list={f.suggestions ? `dl-${f.key}` : undefined}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                )}
                {f.suggestions && (
                  <datalist id={`dl-${f.key}`}>
                    {f.suggestions.map((x) => <option key={x} value={x} />)}
                  </datalist>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-5">
          {onDelete ? (
            <button
              type="button"
              className="btn-danger"
              onClick={async () => {
                if (window.confirm("Delete this?")) {
                  await onDelete();
                  onClose();
                }
              }}
            >
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export const opts = (xs: string[] | Record<string, string>) =>
  Array.isArray(xs) ? xs.map((x) => ({ value: x, label: x })) : Object.entries(xs).map(([value, label]) => ({ value, label }));
