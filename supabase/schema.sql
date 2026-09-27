-- Big Move — database schema
-- Run this once in the Supabase SQL editor.
-- Everything is shared between household members (Gareth and Kristin).
-- Only emails listed in public.members can see or change any data.

-- ---------------------------------------------------------------
-- Members (who is allowed in)
-- ---------------------------------------------------------------
create table if not exists public.members (
  email text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.my_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select name from public.members
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- ---------------------------------------------------------------
-- Tasks (To-Do list + Diary)
-- ---------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'General',
  kind text not null default 'task' check (kind in ('task', 'appointment')),
  due_date date,
  due_time time,
  owner text not null default 'Both',
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Possessions
-- ---------------------------------------------------------------
create table if not exists public.possessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  room text not null default 'Other',
  category text not null default 'General',
  destination text not null default 'undecided'
    check (destination in ('undecided', 'london', 'country', 'storage', 'sell', 'donate', 'dispose')),
  status text not null default 'in_place'
    check (status in ('in_place', 'packed', 'in_storage', 'moved', 'gone')),
  box_label text,
  quantity integer not null default 1,
  est_value numeric,
  size text check (size in ('small', 'medium', 'large', 'furniture')),
  fragile boolean not null default false,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Properties
-- ---------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'london' check (kind in ('london', 'country')),
  address text,
  area text,
  asking_price numeric,
  bedrooms integer,
  bathrooms integer,
  sq_ft integer,
  tenure text,
  service_charge numeric,
  ground_rent numeric,
  council_tax_band text,
  epc text,
  outside_space text,
  parking text,
  link text,
  agent text,
  status text not null default 'shortlist'
    check (status in ('shortlist', 'viewing', 'second_viewing', 'offer', 'agreed', 'rejected')),
  viewing_date date,
  gareth_score integer check (gareth_score between 0 and 10),
  kristin_score integer check (kristin_score between 0 and 10),
  gareth_notes text,
  kristin_notes text,
  pros text,
  cons text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Budget
-- ---------------------------------------------------------------
create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  section text not null default 'Moving costs'
    check (section in ('Sale proceeds', 'London purchase', 'Country purchase', 'Moving costs', 'Storage', 'Other')),
  direction text not null default 'out' check (direction in ('in', 'out')),
  estimate numeric,
  actual numeric,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Contacts (agents, solicitors, removals, storage…)
-- ---------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  role text not null default 'Other',
  phone text,
  email text,
  website text,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Ask Claude — shared conversation history
-- ---------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  author text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- updated_at + created_by triggers
-- ---------------------------------------------------------------
create or replace function public.touch_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' and new.created_by is null then
    new.created_by := public.my_name();
  end if;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['tasks', 'possessions', 'properties', 'budget_items', 'contacts'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before insert or update on public.%1$s for each row execute function public.touch_row()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------
-- Row level security: members only
-- ---------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['members', 'tasks', 'possessions', 'properties', 'budget_items', 'contacts', 'chat_messages'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists members_all on public.%I', t);
    execute format('create policy members_all on public.%I for all to authenticated using (public.is_member()) with check (public.is_member())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------
-- First household member. Kristin is added from the app's Settings tab.
-- ---------------------------------------------------------------
insert into public.members (email, name) values
  ('garethwilliams236@gmail.com', 'Gareth')
on conflict (email) do nothing;
