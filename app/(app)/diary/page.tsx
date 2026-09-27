"use client";

import { useMemo, useState } from "react";
import { useTable } from "@/lib/useTable";
import type { Task } from "@/lib/types";
import { EditDialog } from "@/components/EditDialog";
import { ErrorNote, PageHeader } from "@/components/PageHeader";
import { TaskRow } from "@/components/TaskRow";
import { newTask, taskFields } from "@/lib/taskFields";
import { longDate, todayISO } from "@/lib/format";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DiaryPage() {
  const { rows, error, save, remove } = useTable<Task>("tasks", "due_date");
  const today = todayISO();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [editing, setEditing] = useState<Task | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"month" | "agenda">("month");

  const byDate = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of rows) {
      if (!t.due_date) continue;
      if (!m.has(t.due_date)) m.set(t.due_date, []);
      m.get(t.due_date)!.push(t);
    }
    for (const list of m.values()) list.sort((a, b) => (a.due_time ?? "99").localeCompare(b.due_time ?? "99"));
    return m;
  }, [rows]);

  const cells = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [month]);

  const agenda = useMemo(
    () => [...byDate.entries()].filter(([d]) => d >= today).sort(([a], [b]) => a.localeCompare(b)).slice(0, 30),
    [byDate, today],
  );

  const dayItems = byDate.get(selected) ?? [];
  const toggle = (t: Task) => save({ status: t.status === "done" ? "todo" : "done" }, t.id);

  return (
    <>
      <PageHeader title="Diary" subtitle="Tasks and appointments by date">
        <div className="flex rounded-lg border border-line overflow-hidden">
          {(["month", "agenda"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm ${view === v ? "bg-brand text-white" : "bg-white"}`}>
              {v === "month" ? "Month" : "Agenda"}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setAdding(true)}>+ Add</button>
      </PageHeader>
      <ErrorNote error={error} />

      {view === "month" ? (
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <button className="btn-ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
              <div className="font-semibold">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
              <button className="btn-ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-muted mb-1">
              {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const key = iso(d);
                const items = byDate.get(key) ?? [];
                const inMonth = d.getMonth() === month.getMonth();
                const open = items.filter((t) => t.status !== "done");
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`min-h-16 sm:min-h-20 rounded-lg p-1 text-left border text-xs flex flex-col gap-0.5 ${
                      key === selected ? "border-brand ring-2 ring-brand/20" : "border-transparent hover:bg-black/[0.03]"
                    } ${inMonth ? "" : "opacity-40"}`}
                  >
                    <span className={`inline-grid place-items-center size-6 rounded-full ${key === today ? "bg-accent text-white font-semibold" : ""}`}>
                      {d.getDate()}
                    </span>
                    <span className="hidden sm:flex flex-col gap-0.5">
                      {items.slice(0, 2).map((t) => (
                        <span key={t.id} className={`truncate rounded px-1 ${t.status === "done" ? "text-muted line-through" : t.kind === "appointment" ? "bg-accent-soft text-accent" : "bg-brand-soft text-brand"}`}>
                          {t.title}
                        </span>
                      ))}
                      {items.length > 2 && <span className="text-muted">+{items.length - 2} more</span>}
                    </span>
                    {items.length > 0 && (
                      <span className="sm:hidden flex gap-0.5">
                        {open.length > 0 ? <span className="size-1.5 rounded-full bg-brand" /> : <span className="size-1.5 rounded-full bg-muted/40" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm">{longDate(selected)}</h2>
              <button className="btn-ghost text-sm" onClick={() => setAdding(true)}>+ Add</button>
            </div>
            <div className="card divide-y divide-line overflow-hidden">
              {dayItems.length === 0 ? (
                <p className="text-sm text-muted p-3">Nothing on this day.</p>
              ) : (
                dayItems.map((t) => <TaskRow key={t.id} t={t} showDate={false} onOpen={() => setEditing(t)} onToggle={() => toggle(t)} />)
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {agenda.length === 0 && <p className="text-sm text-muted">Nothing coming up.</p>}
          {agenda.map(([d, items]) => (
            <section key={d}>
              <h2 className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${d === today ? "text-accent" : "text-muted"}`}>
                {d === today ? "Today · " : ""}{longDate(d)}
              </h2>
              <div className="card divide-y divide-line overflow-hidden">
                {items.map((t) => <TaskRow key={t.id} t={t} showDate={false} onOpen={() => setEditing(t)} onToggle={() => toggle(t)} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      <EditDialog
        open={adding || !!editing}
        title={editing ? "Edit" : "New diary item"}
        fields={taskFields}
        initial={editing ?? newTask(selected)}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={(v) => save(v as Partial<Task>, editing?.id)}
        onDelete={editing ? () => remove(editing.id) : undefined}
      />
    </>
  );
}
