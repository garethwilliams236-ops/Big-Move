"use client";

import { useMemo, useState } from "react";
import { useTable } from "@/lib/useTable";
import type { Task } from "@/lib/types";
import { EditDialog } from "@/components/EditDialog";
import { ErrorNote, PageHeader } from "@/components/PageHeader";
import { TaskRow } from "@/components/TaskRow";
import { newTask, OWNERS, TASK_CATEGORIES, taskFields } from "@/lib/taskFields";
import { todayISO } from "@/lib/format";

export default function TodoPage() {
  const { rows, loading, error, save, remove } = useTable<Task>("tasks", "due_date");
  const [editing, setEditing] = useState<Task | null>(null);
  const [adding, setAdding] = useState(false);
  const [show, setShow] = useState<"open" | "done" | "all">("open");
  const [owner, setOwner] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter(
        (t) =>
          (show === "all" || (show === "done" ? t.status === "done" : t.status !== "done")) &&
          (!owner || t.owner === owner || (owner !== "Both" && t.owner === "Both")) &&
          (!category || t.category === category) &&
          (!q || t.title.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, show, owner, category, q],
  );

  const groups = useMemo(() => {
    const today = todayISO();
    const out: { label: string; items: Task[] }[] = [];
    const push = (label: string, t: Task) => {
      let g = out.find((x) => x.label === label);
      if (!g) out.push((g = { label, items: [] }));
      g.items.push(t);
    };
    for (const t of filtered) {
      if (!t.due_date) push("No date", t);
      else if (t.status !== "done" && t.due_date < today) push("Overdue", t);
      else push(new Date(t.due_date + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }), t);
    }
    return out.sort((a, b) => (a.label === "Overdue" ? -1 : b.label === "Overdue" ? 1 : a.label === "No date" ? 1 : b.label === "No date" ? -1 : 0));
  }, [filtered]);

  const openCount = rows.filter((t) => t.status !== "done").length;
  const doneCount = rows.length - openCount;

  return (
    <>
      <PageHeader title="To-Do" subtitle={`${openCount} open · ${doneCount} done`}>
        <button className="btn-primary" onClick={() => setAdding(true)}>+ Add</button>
      </PageHeader>
      <ErrorNote error={error} />

      <div className="flex flex-wrap gap-2 mb-4">
        <input className="input max-w-48" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={show} onChange={(e) => setShow(e.target.value as typeof show)}>
          <option value="open">Open</option>
          <option value="done">Done</option>
          <option value="all">All</option>
        </select>
        <select className="input w-auto" value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">Anyone</option>
          {OWNERS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {TASK_CATEGORIES.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : groups.length === 0 ? (
        <p className="text-muted text-sm">Nothing here.</p>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${g.label === "Overdue" ? "text-danger" : "text-muted"}`}>
                {g.label} <span className="font-normal">({g.items.length})</span>
              </h2>
              <div className="card divide-y divide-line overflow-hidden">
                {g.items.map((t) => (
                  <TaskRow
                    key={t.id}
                    t={t}
                    onOpen={() => setEditing(t)} onDelete={() => remove(t.id)}
                    onToggle={() => save({ status: t.status === "done" ? "todo" : "done" }, t.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <EditDialog
        open={adding || !!editing}
        title={editing ? "Edit" : "New task"}
        fields={taskFields}
        initial={editing ?? newTask()}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(v) => save(v as Partial<Task>, editing?.id)}
        onDelete={editing ? () => remove(editing.id) : undefined}
      />
    </>
  );
}
