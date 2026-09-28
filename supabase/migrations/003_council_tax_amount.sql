-- Annual council tax amount (band alone doesn't give a figure — it varies by council)
alter table public.properties add column if not exists council_tax numeric;
