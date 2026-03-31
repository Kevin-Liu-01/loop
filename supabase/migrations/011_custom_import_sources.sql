-- Custom import sources: Operator users can register additional GitHub repos
-- for the weekly auto-import scan.

create table if not exists custom_import_sources (
  id          uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  name        text not null,
  org         text not null,
  repo        text not null,
  branch      text not null default 'main',
  skills_path text not null default '',
  trust_tier  text not null default 'community' check (trust_tier in ('official', 'community')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_custom_import_sources_user
  on custom_import_sources (clerk_user_id);

alter table custom_import_sources enable row level security;

create policy "Users can view their own custom import sources"
  on custom_import_sources for select
  using (true);

create policy "Users can insert their own custom import sources"
  on custom_import_sources for insert
  with check (clerk_user_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub');

create policy "Users can delete their own custom import sources"
  on custom_import_sources for delete
  using (clerk_user_id = current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
