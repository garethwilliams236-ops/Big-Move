-- Separate Ask Claude conversations per person
alter table public.chat_messages add column if not exists thread text not null default 'Gareth';
create index if not exists chat_messages_thread_idx on public.chat_messages (thread, created_at);

-- ---------------------------------------------------------------
-- Audit trail: every insert / update / delete, with who and what changed
-- ---------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  who text,
  table_name text not null,
  row_id text,
  action text not null check (action in ('added', 'changed', 'deleted')),
  label text,
  changes jsonb
);
create index if not exists audit_log_at_idx on public.audit_log (at desc);

create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  o jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  n jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  r jsonb := coalesce(n, o);
  diff jsonb := '{}'::jsonb;
  k text;
begin
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(n) loop
      if k not in ('updated_at', 'created_at', 'created_by') and (o -> k) is distinct from (n -> k) then
        diff := diff || jsonb_build_object(k, jsonb_build_object('from', o -> k, 'to', n -> k));
      end if;
    end loop;
    if diff = '{}'::jsonb then
      return new;
    end if;
  end if;

  insert into public.audit_log (who, table_name, row_id, action, label, changes)
  values (
    coalesce(public.my_name(), auth.jwt() ->> 'email', 'system'),
    tg_table_name,
    coalesce(r ->> 'id', r ->> 'email'),
    case tg_op when 'INSERT' then 'added' when 'UPDATE' then 'changed' else 'deleted' end,
    left(coalesce(r ->> 'title', r ->> 'name', r ->> 'label', r ->> 'email', ''), 200),
    case when tg_op = 'UPDATE' then diff when tg_op = 'DELETE' then o else null end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['tasks', 'possessions', 'properties', 'budget_items', 'contacts', 'members'] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.audit_row()', t);
  end loop;
end $$;

-- Members can read the log; nobody can edit or delete it from the app.
alter table public.audit_log enable row level security;
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated using (public.is_member());
