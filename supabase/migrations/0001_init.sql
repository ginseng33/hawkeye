-- Hawkeye initial schema
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> paste -> Run

create extension if not exists "pgcrypto";

-- Team members (one row per person who logs into Hawkeye)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Shared pipeline status used by both stores and creators
create type pipeline_status as enum (
  'new',
  'to_contact',
  'contacted',
  'replied',
  'sample_sent',
  'negotiating',
  'partner',
  'rejected',
  'not_interested'
);

create table stores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null,
  city text,
  country text,
  address text,
  website text,
  instagram_handle text,
  email text,
  phone text,
  contact_person text,

  brands_sold text[] not null default '{}',
  estimated_price_range text,
  style_tags text[] not null default '{}',
  business_model text not null default 'unknown'
    check (business_model in ('wholesale', 'consignment', 'unknown')),

  market_tier smallint check (market_tier between 1 and 5),
  source text not null default 'manual'
    check (source in ('csv', 'google_places', 'manual')),
  google_place_id text unique,
  raw_data jsonb not null default '{}',

  score_total numeric,
  score_style numeric,
  score_price numeric,
  score_market numeric,
  score_instagram numeric,
  score_rationale text,

  pipeline_status pipeline_status not null default 'new',
  next_action_date date,
  notes text
);

create table creators (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  handle text not null unique,
  full_name text,
  city text,
  country text,

  follower_count integer,
  engagement_rate numeric,
  avg_likes integer,
  avg_comments integer,
  post_frequency text,
  fake_follower_signal numeric,
  aesthetic_tags text[] not null default '{}',
  raw_data jsonb not null default '{}',

  score_aesthetic numeric,
  score_engagement numeric,
  score_authenticity numeric,
  score_content_quality numeric,
  score_total numeric,
  score_rationale text,

  pipeline_status pipeline_status not null default 'new',
  next_action_date date,
  notes text
);

-- Polymorphic link: an interaction/draft belongs to exactly one store OR one creator
create table interactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id),

  store_id uuid references stores(id) on delete cascade,
  creator_id uuid references creators(id) on delete cascade,
  check (
    (store_id is not null and creator_id is null) or
    (store_id is null and creator_id is not null)
  ),

  occurred_at timestamptz not null default now(),
  channel text not null check (channel in ('email', 'dm', 'phone', 'visit', 'other')),
  interaction_type text not null check (interaction_type in (
    'first_contact', 'follow_up', 'reply', 'call',
    'sample_sent', 'agreement', 'garment_sent', 'content_published'
  )),
  message_variant text,
  notes text
);

create table message_drafts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  store_id uuid references stores(id) on delete cascade,
  creator_id uuid references creators(id) on delete cascade,
  check (
    (store_id is not null and creator_id is null) or
    (store_id is null and creator_id is not null)
  ),

  channel text not null check (channel in ('email', 'dm')),
  variant_label text,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'sent')),
  generated_by text not null default 'claude'
);

create table api_usage (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  service text not null check (service in ('anthropic', 'google_places', 'apify')),
  operation text not null,
  units integer not null default 1,
  estimated_cost_usd numeric not null default 0,
  metadata jsonb not null default '{}'
);

create table budget_limits (
  service text primary key check (service in ('anthropic', 'google_places', 'apify')),
  monthly_limit_usd numeric not null,
  alert_threshold_pct numeric not null default 80,
  updated_at timestamptz not null default now()
);

create table scoring_weights (
  entity_type text not null check (entity_type in ('store', 'creator')),
  criterion text not null,
  weight numeric not null check (weight >= 0 and weight <= 1),
  updated_at timestamptz not null default now(),
  primary key (entity_type, criterion)
);

-- Conservative default monthly budget caps (editable later in Settings)
insert into budget_limits (service, monthly_limit_usd, alert_threshold_pct) values
  ('anthropic', 20, 80),
  ('google_places', 20, 80),
  ('apify', 20, 80);

-- Default weights from the brand brief
insert into scoring_weights (entity_type, criterion, weight) values
  ('store', 'style_and_brands', 0.40),
  ('store', 'price_coherence', 0.25),
  ('store', 'market_fit', 0.20),
  ('store', 'instagram_quality', 0.15),
  ('creator', 'aesthetic_affinity', 0.40),
  ('creator', 'engagement_rate', 0.30),
  ('creator', 'audience_authenticity', 0.15),
  ('creator', 'content_quality', 0.15);

-- Row Level Security: any logged-in team member can read/write everything.
-- This is an internal tool for 2-3 people, so we keep policies simple.
alter table profiles enable row level security;
alter table stores enable row level security;
alter table creators enable row level security;
alter table interactions enable row level security;
alter table message_drafts enable row level security;
alter table api_usage enable row level security;
alter table budget_limits enable row level security;
alter table scoring_weights enable row level security;

create policy "team can read profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "team full access stores" on stores for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "team full access creators" on creators for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "team full access interactions" on interactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "team full access message_drafts" on message_drafts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "team full access api_usage" on api_usage for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "team full access budget_limits" on budget_limits for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "team full access scoring_weights" on scoring_weights for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Auto-create a profile row whenever someone signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
