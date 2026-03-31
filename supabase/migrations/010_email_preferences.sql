-- Loop: email preferences and weekly import tracking

-- User email preferences for digest opt-in/out
create table if not exists email_preferences (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text not null,
  weekly_digest boolean not null default true,
  automation_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_preferences_clerk_user_id_idx
  on email_preferences (clerk_user_id);

-- Weekly import run log for tracking import history
create table if not exists weekly_import_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  details jsonb not null default '{}',
  status text not null default 'running'
);

create index if not exists weekly_import_runs_started_at_idx
  on weekly_import_runs (started_at desc);
