"use client";

import type { Task } from "@/lib/types";
import { shortDate, todayISO } from "@/lib/format";

const ownerColour: Record<string, string> = {
  Gareth: "bg-sky-100 text-sky-800",
  Kristin: "bg-rose-100 text-rose-800",
  Both: "bg-brand-soft text-brand",
};

export function TaskRow({ t, onToggle, onOpen, showDate = true }: { t: Task; onToggle: () => void; onOpen: () => void; showDate?: boolean }) {
  const overdue = t.status !== "done" && t.due_date && t.due_date < todayISO();
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 hover:bg-black/[0.02]">
      <input
        type="checkbox"
        className="mt-1 size-4 accent-[var(--color-brand)]"
        checked={t.status === "done"}
        onChange={onToggle}
        aria-label="Done"
      />
      <button className="flex-1 text-left min-w-0" onClick={onOpen}>
        <div className={`text-sm ${t.status === "done" ? "line-through text-muted" : ""}`}>
          {t.kind === "appointment" && <span className="mr-1">📅</span>}
          {t.priority === "high" && t.status !== "done" && <span className="text-accent mr-1">●</span>}
          {t.title}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted">
          {showDate && t.due_date && (
            <span className={overdue ? "text-danger font-medium" : ""}>
              {shortDate(t.due_date)}
              {t.due_time ? ` ${t.due_time.slice(0, 5)}` : ""}
            </span>
          )}
          {!showDate && t.due_time && <span>{t.due_time.slice(0, 5)}</span>}
          <span className="chip bg-black/5 text-muted">{t.category}</span>
          <span className={`chip ${ownerColour[t.owner] ?? "bg-black/5"}`}>{t.owner}</span>
          {t.status === "doing" && <span className="chip bg-accent-soft text-accent">In progress</span>}
        </div>
      </button>
    </div>
  );
}
