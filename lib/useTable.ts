"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Row = { id: string };

export function useTable<T extends Row>(table: string, orderBy: string, ascending = true) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser().from(table).select("*").order(orderBy, { ascending, nullsFirst: false });
    if (error) setError(error.message);
    else {
      setError(null);
      setRows((data ?? []) as T[]);
    }
    setLoading(false);
  }, [table, orderBy, ascending]);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const save = useCallback(
    async (values: Partial<T>, id?: string) => {
      const sb = supabaseBrowser();
      const clean = Object.fromEntries(
        Object.entries(values).filter(([k]) => !["id", "created_at", "updated_at", "created_by"].includes(k)),
      );
      const { error } = id ? await sb.from(table).update(clean).eq("id", id) : await sb.from(table).insert(clean);
      if (error) {
        setError(error.message);
        return false;
      }
      await load();
      return true;
    },
    [table, load],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabaseBrowser().from(table).delete().eq("id", id);
      if (error) setError(error.message);
      await load();
    },
    [table, load],
  );

  return { rows, loading, error, reload: load, save, remove };
}
