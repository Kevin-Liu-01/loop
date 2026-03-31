-- Loop: skill visibility (public/private) and forking support
-- Adds forked_from_slug to track skill lineage and updates existing
-- Loop-published skills to ensure they are all public.

-- Track which skill a copy was forked from
alter table skills
  add column if not exists forked_from_slug text;

create index if not exists skills_forked_from_slug_idx
  on skills (forked_from_slug)
  where forked_from_slug is not null;

-- Ensure all existing Loop-authored skills are public
update skills
set visibility = 'public'
where author_id = (select id from skill_authors where slug = 'loop')
  and visibility is distinct from 'public';

-- Ensure all existing skills without explicit visibility are public
update skills
set visibility = 'public'
where visibility is null or visibility = '';
