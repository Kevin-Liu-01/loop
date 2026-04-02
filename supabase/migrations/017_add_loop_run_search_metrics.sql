-- Add web search metrics to loop_runs for agent search feature
alter table loop_runs
  add column if not exists searches_used integer,
  add column if not exists added_sources jsonb;
