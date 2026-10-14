-- Fase 4: track where each creator candidate came from
alter table creators add column source text not null default 'manual'
  check (source in ('hashtag', 'seed_handle', 'brand_mentions', 'manual'));
