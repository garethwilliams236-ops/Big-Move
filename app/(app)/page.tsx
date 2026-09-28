import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import type { Possession, Property, Task } from "@/lib/types";
import { daysUntil, gbp, MOVE_DEADLINE, shortDate, todayISO } from "@/lib/format";
import { DESTINATIONS } from "@/lib/possessionMeta";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const sb = await supabaseServer();
  const [{ data: tasks }, { data: items }, { data: props }, { data: name }] = await Promise.all([
    sb.from("tasks").select("*").order("due_date", { ascending: true, nullsFirst: false }),
    sb.from("possessions").select("destination,status,quantity"),
    sb.from("properties").select("id,name,kind,status,asking_price,gareth_score,kristin_score,viewing_date,service_charge,ground_rent,council_tax").neq("status", "rejected"),
    sb.rpc("my_name"),
  ]);
  const T = (tasks ?? []) as Task[];
  const P = (items ?? []) as Pick<Possession, "destination" | "status" | "quantity">[];
  const R = (props ?? []) as Property[];
  const today = todayISO();
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const done = T.filter((t) => t.status === "done").length;
  const pct = T.length ? Math.round((done / T.length) * 100) : 0;
  const overdue = T.filter((t) => t.status !== "done" && t.due_date && t.due_date < today);
  const upcoming = T.filter((t) => t.status !== "done" && t.due_date && t.due_date >= today && t.due_date <= in14);
  const mine = T.filter((t) => t.status !== "done" && (t.owner === name || t.owner === "Both")).length;
  const days = daysUntil(MOVE_DEADLINE);

  const undecided = P.filter((p) => p.destination === "undecided").length;
  const packed = P.filter((p) => p.status !== "in_place").length;

  const avg = (p: Property) => {
    const s = [p.gareth_score, p.kristin_score].filter((x): x is number => x != null);
    return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null;
  };
  const top = (k: "london" | "country") =>
    R.filter((p) => p.kind === k).sort((a, b) => (avg(b) ?? -1) - (avg(a) ?? -1)).slice(0, 3);

  const Stat = ({ label, value, sub, href }: { label: string; value: React.ReactNode; sub?: string; href: string }) => (
    <Link href={href} className="card p-4 hover:shadow-md transition-shadow">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-semibold mt-0.5">{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </Link>
  );

  const TaskLine = ({ t }: { t: Task }) => (
    <li className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="truncate">{t.kind === "appointment" ? "📅 " : ""}{t.title}</span>
      <span className="text-xs text-muted whitespace-nowrap">{t.owner} · {shortDate(t.due_date)}</span>
    </li>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-brand text-white p-5 sm:p-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-white/70">Hello {name as string}</div>
          <h1 className="text-2xl sm:text-3xl font-semibold">{days > 0 ? `${days} days to go` : "Move deadline reached"}</h1>
          <div className="text-sm text-white/70">Target: out of Fulham by end of March 2027</div>
        </div>
        <div className="min-w-52">
          <div className="flex justify-between text-sm mb-1"><span>Checklist</span><span>{pct}%</span></div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-accent-soft" style={{ width: `${pct}%` }} /></div>
          <div className="text-xs text-white/70 mt-1">{done} of {T.length} done</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Overdue" value={<span className={overdue.length ? "text-danger" : ""}>{overdue.length}</span>} sub="tasks past their date" href="/todo" />
        <Stat label="On your plate" value={mine} sub="open tasks for you or both" href="/todo" />
        <Stat label="Possessions" value={P.length} sub={`${undecided} undecided · ${packed} packed`} href="/possessions" />
        <Stat label="Properties in play" value={R.length} sub={`${R.filter((p) => p.kind === "london").length} London · ${R.filter((p) => p.kind === "country").length} country`} href="/properties" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold">Next two weeks</h2>
            <Link href="/diary" className="text-xs text-brand">Diary →</Link>
          </div>
          {overdue.length > 0 && (
            <>
              <div className="text-xs font-semibold text-danger mt-2">Overdue</div>
              <ul className="divide-y divide-line">{overdue.slice(0, 5).map((t) => <TaskLine key={t.id} t={t} />)}</ul>
            </>
          )}
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted py-2">Nothing due in the next 14 days.</p>
          ) : (
            <ul className="divide-y divide-line">{upcoming.map((t) => <TaskLine key={t.id} t={t} />)}</ul>
          )}
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Where things are going</h2>
            <Link href="/possessions" className="text-xs text-brand">Possessions →</Link>
          </div>
          {P.length === 0 ? (
            <p className="text-sm text-muted">No possessions listed yet.</p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(DESTINATIONS).map(([k, v]) => {
                const n = P.filter((p) => p.destination === k).reduce((s, p) => s + p.quantity, 0);
                const total = P.reduce((s, p) => s + p.quantity, 0);
                return (
                  <div key={k} className="flex items-center gap-2 text-sm">
                    <span className="w-28 shrink-0">{v.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-black/5 overflow-hidden"><div className="h-full bg-brand" style={{ width: `${(n / total) * 100}%` }} /></div>
                    <span className="w-8 text-right tabular-nums text-muted">{n}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {(["london", "country"] as const).map((k) => (
          <section key={k} className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">Top {k === "london" ? "London flats" : "country properties"}</h2>
              <Link href="/properties" className="text-xs text-brand">Properties →</Link>
            </div>
            {top(k).length === 0 ? (
              <p className="text-sm text-muted py-2">None added yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {top(k).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{p.name}</span>
                    <span className="text-muted text-right">
                      {gbp(p.asking_price)}
                      {avg(p) != null ? ` · ${avg(p)!.toFixed(1)}/10` : ""}
                      {(() => {
                        const yr = (p.service_charge ?? 0) + (p.ground_rent ?? 0) + (p.council_tax ?? 0);
                        return yr > 0 ? <span className="block text-xs">{gbp(Math.round(yr / 12))}/month running costs</span> : null;
                      })()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
