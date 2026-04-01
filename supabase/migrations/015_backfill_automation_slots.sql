-- Backfill automation slots for daily-only cron.
--
-- The Vercel Hobby plan fires one daily cron at 09:00 UTC, so the old
-- round-robin hourly slots no longer apply. This migration:
--   1. Sets all preferredHour to 9 (the daily cron hour).
--   2. Sets preferredDay to 1 (Monday) for weekly automations that lack one.
--   3. Resets consecutiveFailures so stuck automations can retry.

-- 1. Set all automations to preferredHour = 9 (daily cron time).
update skills
set automation = automation || jsonb_build_object('preferredHour', 9)
where automation is not null
  and (automation->>'preferredHour' is null or (automation->>'preferredHour')::int != 9);

-- 2. Give weekly automations a default preferredDay (Monday = 1) if missing.
update skills
set automation = automation || jsonb_build_object('preferredDay', 1)
where automation is not null
  and automation->>'cadence' = 'weekly'
  and automation->>'preferredDay' is null;

-- 3. Reset consecutiveFailures to 0 for all skills that have any.
update skills
set automation = automation || jsonb_build_object('consecutiveFailures', 0)
where automation is not null
  and (automation->>'consecutiveFailures')::int > 0;
