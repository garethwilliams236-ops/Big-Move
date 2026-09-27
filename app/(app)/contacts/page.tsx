"use client";

import { useState } from "react";
import { useTable } from "@/lib/useTable";
import type { Contact } from "@/lib/types";
import { EditDialog, type Field } from "@/components/EditDialog";
import { ErrorNote, PageHeader } from "@/components/PageHeader";

const ROLES = ["Selling agent", "Buying agent", "Solicitor", "Mortgage broker", "Surveyor", "Removals", "Storage", "Tax adviser", "Tradesperson", "Utilities", "Other"];

const fields: Field[] = [
  { key: "name", label: "Name", required: true, half: true },
  { key: "company", label: "Company", half: true },
  { key: "role", label: "Role", suggestions: ROLES, required: true },
  { key: "phone", label: "Phone", type: "text", half: true },
  { key: "email", label: "Email", type: "text", half: true },
  { key: "website", label: "Website", type: "url" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default function ContactsPage() {
  const { rows, loading, error, save, remove } = useTable<Contact>("contacts", "role");
  const [editing, setEditing] = useState<Contact | null>(null);
  const [adding, setAdding] = useState(false);

  const roles = [...new Set(rows.map((c) => c.role))].sort();

  return (
    <>
      <PageHeader title="Contacts" subtitle="Agents, solicitors, removals, storage and anyone else involved">
        <button className="btn-primary" onClick={() => setAdding(true)}>+ Add contact</button>
      </PageHeader>
      <ErrorNote error={error} />
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="card p-6 text-center text-sm text-muted">No contacts yet.</div>
      ) : (
        <div className="space-y-5">
          {roles.map((r) => (
            <section key={r}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">{r}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rows.filter((c) => c.role === r).map((c) => (
                  <div key={c.id} className="card p-3 text-sm">
                    <button className="font-semibold hover:underline text-left" onClick={() => setEditing(c)}>{c.name}</button>
                    {c.company && <div className="text-muted">{c.company}</div>}
                    <div className="mt-2 flex flex-col gap-0.5">
                      {c.phone && <a className="text-brand" href={`tel:${c.phone}`}>{c.phone}</a>}
                      {c.email && <a className="text-brand" href={`mailto:${c.email}`}>{c.email}</a>}
                      {c.website && <a className="text-brand" href={c.website} target="_blank" rel="noreferrer">Website ↗</a>}
                    </div>
                    {c.notes && <p className="text-xs text-muted mt-2 whitespace-pre-line">{c.notes}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <EditDialog
        open={adding || !!editing}
        title={editing ? "Edit contact" : "New contact"}
        fields={fields}
        initial={editing ?? { name: "", role: "Other" }}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(v) => save(v as Partial<Contact>, editing?.id)}
        onDelete={editing ? () => remove(editing.id) : undefined}
      />
    </>
  );
}
