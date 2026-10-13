-- Allow 'web_search' as a store source (Fase 3: discovery via Claude web search)
alter table stores drop constraint stores_source_check;
alter table stores add constraint stores_source_check
  check (source in ('csv', 'google_places', 'web_search', 'manual'));
