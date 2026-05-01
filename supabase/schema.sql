-- MyInjuryValue.com — Supabase schema
-- Run this in the Supabase SQL editor for a fresh project.

create table if not exists case_calculator_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  injury_level text,
  vehicle_damage_gate text,
  accident_timing text,
  accident_type text,
  hit_and_run_details text,
  rideshare_status text,
  medical_treatment text,
  hospital_admitted text,
  planned_treatment text,
  no_treatment_reason text,
  still_in_pain text,
  fault text,
  ticket text,
  police_scene text,
  police_report text,
  no_police_reason text,
  other_driver_insured text,
  insurance_spoken text,
  insurance_offer text,
  offer_amount text,
  work_impact text,
  work_loss_details text,
  signed_anything text,
  has_attorney text,
  switching_attorney text,
  incident_description text,
  state text,

  first_name text,
  last_name text,
  phone text,
  email text,

  score int,
  value_min int,
  value_max int,
  lead_quality text,
  status text default 'new',

  source text,
  utm_source text,
  utm_campaign text,
  utm_adset text,
  utm_ad text,
  fbclid text,
  fbp text,
  fbc text,
  event_source_url text
);

create table if not exists call_attempts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references case_calculator_leads(id) on delete cascade,
  created_at timestamptz default now(),
  intake_rep_phone text,
  intake_call_sid text,
  lead_call_sid text,
  status text,
  accepted_by text,
  duration_seconds int,
  recording_url text,
  failure_reason text
);

create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references case_calculator_leads(id) on delete cascade,
  created_at timestamptz default now(),
  rep_name text,
  note text
);

create table if not exists intake_reps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  phone text not null,
  priority_order int default 1,
  active boolean default true,
  timezone text default 'America/Los_Angeles',
  working_hours_start text,
  working_hours_end text
);

create index if not exists idx_leads_created_at on case_calculator_leads(created_at desc);
create index if not exists idx_leads_quality on case_calculator_leads(lead_quality);
create index if not exists idx_leads_status on case_calculator_leads(status);
create index if not exists idx_call_attempts_lead_id on call_attempts(lead_id);
create index if not exists idx_notes_lead_id on lead_notes(lead_id);

-- RLS: lock everything to service role; the dashboard reads via the service role key on the server.
alter table case_calculator_leads enable row level security;
alter table call_attempts enable row level security;
alter table lead_notes enable row level security;
alter table intake_reps enable row level security;
