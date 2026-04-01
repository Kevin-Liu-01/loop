-- Backfill automation preferred_hour across 24 hourly slots and reset
-- consecutive failures so old stuck automations can run again.
--
-- Skills with automation enabled but no preferredHour are distributed
-- round-robin across hours 0-23 using their row_number for even spread.
-- All skills with consecutiveFailures > 0 are reset to 0.

-- 1. Round-robin assign preferredHour to enabled automations that lack one.
with numbered as (
  select
    id,
    row_number() over (order by created_at, slug) - 1 as rn
  from skills
  where automation is not null
    and (automation->>'enabled')::boolean = true
    and (
      automation->>'preferredHour' is null
      or automation->'preferredHour' is null
    )
)
update skills s
set automation = s.automation || jsonb_build_object(
  'preferredHour', (n.rn % 24)::int
)
from numbered n
where s.id = n.id;

-- 2. Give disabled/paused automations a default slot (12) if they have none,
--    so they're ready when re-enabled.
update skills
set automation = automation || jsonb_build_object('preferredHour', 12)
where automation is not null
  and automation->>'preferredHour' is null;

-- 3. Reset consecutiveFailures to 0 for all skills that have any.
update skills
set automation = automation || jsonb_build_object('consecutiveFailures', 0)
where automation is not null
  and (automation->>'consecutiveFailures')::int > 0;
