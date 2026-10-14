-- Configurable minimum score to keep a discovered candidate (was hardcoded at 75)
create table score_thresholds (
  entity_type text primary key check (entity_type in ('store', 'creator')),
  threshold numeric not null check (threshold >= 0 and threshold <= 100),
  updated_at timestamptz not null default now()
);

insert into score_thresholds (entity_type, threshold) values
  ('store', 75),
  ('creator', 60);

alter table score_thresholds enable row level security;
create policy "team full access score_thresholds" on score_thresholds for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
