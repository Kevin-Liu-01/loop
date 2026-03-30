-- ==========================================================================
-- Fix icon_url values in production:
--   1. Replace broken SimpleIcons slugs (404) with working alternatives
--   2. Replace Google favicon URLs with SimpleIcons or GitHub avatars
--   3. Migrate all /white SimpleIcons URLs to colored (official brand color)
--
-- Safe to run multiple times — each UPDATE matches on the exact old URL.
-- ==========================================================================

-- -------------------------------------------------------------------------
-- Step 1: Fix broken SimpleIcons slugs → correct slug or GitHub avatar
-- -------------------------------------------------------------------------

-- Skills
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/lighthouse'
WHERE icon_url IN ('https://cdn.simpleicons.org/googlelighthouse/white', 'https://cdn.simpleicons.org/googlelighthouse');

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/css'
WHERE icon_url IN ('https://cdn.simpleicons.org/css3/white', 'https://cdn.simpleicons.org/css3');

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/mozilla'
WHERE icon_url IN ('https://cdn.simpleicons.org/w3c/white', 'https://cdn.simpleicons.org/w3c');

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/google'
WHERE icon_url IN ('https://cdn.simpleicons.org/schemadotorg/white', 'https://cdn.simpleicons.org/schemadotorg');

UPDATE skills SET icon_url = 'https://github.com/openai.png?size=64'
WHERE icon_url IN ('https://cdn.simpleicons.org/openai/white', 'https://cdn.simpleicons.org/openai');

-- MCPs
UPDATE imported_mcps SET icon_url = 'https://github.com/neondatabase.png?size=64'
WHERE icon_url IN ('https://cdn.simpleicons.org/neon/white', 'https://cdn.simpleicons.org/neon');

UPDATE imported_mcps SET icon_url = 'https://github.com/microsoft.png?size=64'
WHERE icon_url IN ('https://cdn.simpleicons.org/playwright/white', 'https://cdn.simpleicons.org/playwright');

UPDATE imported_mcps SET icon_url = 'https://github.com/slack.png?size=64'
WHERE icon_url IN ('https://cdn.simpleicons.org/slack/white', 'https://cdn.simpleicons.org/slack');

UPDATE imported_mcps SET icon_url = 'https://github.com/openai.png?size=64'
WHERE icon_url IN ('https://cdn.simpleicons.org/openai/white', 'https://cdn.simpleicons.org/openai');

UPDATE imported_mcps SET icon_url = 'https://github.com/amazon.png?size=64'
WHERE icon_url IN ('https://cdn.simpleicons.org/amazonaws/white', 'https://cdn.simpleicons.org/amazonaws');

-- -------------------------------------------------------------------------
-- Step 2: Replace Google favicon URLs with SimpleIcons or GitHub avatars
-- -------------------------------------------------------------------------

-- Skills: Google favicons → SimpleIcons (colored)
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/figma'       WHERE icon_url LIKE '%favicons?domain=figma.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/framer'      WHERE icon_url LIKE '%favicons?domain=motion.dev%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/greensock'   WHERE icon_url LIKE '%favicons?domain=gsap.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/threedotjs'  WHERE icon_url LIKE '%favicons?domain=threejs.org%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/tailwindcss' WHERE icon_url LIKE '%favicons?domain=tailwindcss.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/nextdotjs'   WHERE icon_url LIKE '%favicons?domain=nextjs.org%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/react'       WHERE icon_url LIKE '%favicons?domain=react.dev%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/google'      WHERE icon_url LIKE '%favicons?domain=ai.google.dev%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/google'      WHERE icon_url LIKE '%favicons?domain=schema.org%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/semrush'     WHERE icon_url LIKE '%favicons?domain=semrush.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/cloudflare'  WHERE icon_url LIKE '%favicons?domain=cloudflare.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/supabase'    WHERE icon_url LIKE '%favicons?domain=supabase.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/grafana'     WHERE icon_url LIKE '%favicons?domain=grafana.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/vercel'      WHERE icon_url LIKE '%favicons?domain=vercel.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/docker'      WHERE icon_url LIKE '%favicons?domain=docker.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/kubernetes'  WHERE icon_url LIKE '%favicons?domain=kubernetes.io%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/snyk'        WHERE icon_url LIKE '%favicons?domain=snyk.io%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/anthropic'   WHERE icon_url LIKE '%anthropic.com/favicon%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/clerk'       WHERE icon_url LIKE '%favicons?domain=clerk.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/auth0'       WHERE icon_url LIKE '%favicons?domain=auth0.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/github'      WHERE icon_url LIKE '%favicons?domain=github.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/githubactions' WHERE icon_url LIKE '%favicons?domain=githubactions%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/x'           WHERE icon_url LIKE '%favicons?domain=x.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/buffer'      WHERE icon_url LIKE '%favicons?domain=buffer.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/youtube'     WHERE icon_url LIKE '%favicons?domain=youtube.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/notion'      WHERE icon_url LIKE '%favicons?domain=notion.so%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/substack'    WHERE icon_url LIKE '%favicons?domain=substack.com%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/owasp'       WHERE icon_url LIKE '%favicons?domain=owasp.org%';
UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/mozilla'     WHERE icon_url LIKE '%favicons?domain=w3.org%';

-- Skills: Google favicons → GitHub avatar (not on SimpleIcons)
UPDATE skills SET icon_url = 'https://github.com/openai.png?size=64'   WHERE icon_url LIKE '%favicons?domain=openai.com%';
UPDATE skills SET icon_url = 'https://github.com/moz.png?size=64'      WHERE icon_url LIKE '%favicons?domain=moz.com%';

-- MCPs: Google favicons → SimpleIcons (colored)
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/github'      WHERE icon_url LIKE '%favicons?domain=github.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/vercel'      WHERE icon_url LIKE '%favicons?domain=vercel.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/cloudflare'  WHERE icon_url LIKE '%favicons?domain=cloudflare.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/sentry'      WHERE icon_url LIKE '%favicons?domain=sentry.io%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/supabase'    WHERE icon_url LIKE '%favicons?domain=supabase.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/prisma'      WHERE icon_url LIKE '%favicons?domain=prisma.io%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/turso'       WHERE icon_url LIKE '%favicons?domain=turso.tech%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/upstash'     WHERE icon_url LIKE '%favicons?domain=upstash.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/brave'       WHERE icon_url LIKE '%favicons?domain=brave.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/notion'      WHERE icon_url LIKE '%favicons?domain=notion.so%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/linear'      WHERE icon_url LIKE '%favicons?domain=linear.app%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/todoist'     WHERE icon_url LIKE '%favicons?domain=todoist.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/stripe'      WHERE icon_url LIKE '%favicons?domain=stripe.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/figma'       WHERE icon_url LIKE '%favicons?domain=figma.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/grafana'     WHERE icon_url LIKE '%favicons?domain=grafana.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/docker'      WHERE icon_url LIKE '%favicons?domain=docker.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/kubernetes'  WHERE icon_url LIKE '%favicons?domain=kubernetes.io%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/terraform'   WHERE icon_url LIKE '%favicons?domain=terraform.io%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/snyk'        WHERE icon_url LIKE '%favicons?domain=snyk.io%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/puppeteer'   WHERE icon_url LIKE '%favicons?domain=puppeteer%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/resend'      WHERE icon_url LIKE '%favicons?domain=resend.com%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/postgresql'  WHERE icon_url LIKE '%favicons?domain=postgresql%';
UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/sqlite'      WHERE icon_url LIKE '%favicons?domain=sqlite%';

-- MCPs: Google favicons → GitHub avatar (not on SimpleIcons)
UPDATE imported_mcps SET icon_url = 'https://github.com/neondatabase.png?size=64' WHERE icon_url LIKE '%favicons?domain=neon.tech%';
UPDATE imported_mcps SET icon_url = 'https://github.com/microsoft.png?size=64'    WHERE icon_url LIKE '%favicons?domain=playwright.dev%';
UPDATE imported_mcps SET icon_url = 'https://github.com/slack.png?size=64'        WHERE icon_url LIKE '%favicons?domain=slack.com%';
UPDATE imported_mcps SET icon_url = 'https://github.com/openai.png?size=64'       WHERE icon_url LIKE '%favicons?domain=openai.com%';
UPDATE imported_mcps SET icon_url = 'https://github.com/amazon.png?size=64'       WHERE icon_url LIKE '%favicons?domain=aws.amazon%';
UPDATE imported_mcps SET icon_url = 'https://github.com/exa-labs.png?size=64'     WHERE icon_url LIKE '%favicons?domain=exa.ai%';
UPDATE imported_mcps SET icon_url = 'https://github.com/firecrawl.png?size=64'    WHERE icon_url LIKE '%favicons?domain=firecrawl.dev%';

-- -------------------------------------------------------------------------
-- Step 3: Migrate /white → colored (official brand color)
-- Strip the /white suffix from any remaining SimpleIcons URLs
-- -------------------------------------------------------------------------

UPDATE skills
SET icon_url = regexp_replace(icon_url, '/white$', '')
WHERE icon_url LIKE 'https://cdn.simpleicons.org/%/white';

UPDATE imported_mcps
SET icon_url = regexp_replace(icon_url, '/white$', '')
WHERE icon_url LIKE 'https://cdn.simpleicons.org/%/white';

-- -------------------------------------------------------------------------
-- Verification
-- -------------------------------------------------------------------------

SELECT 'skills on Google favicons' AS check, count(*) AS remaining
FROM skills WHERE icon_url LIKE '%google.com/s2/favicons%'
UNION ALL
SELECT 'mcps on Google favicons', count(*)
FROM imported_mcps WHERE icon_url LIKE '%google.com/s2/favicons%'
UNION ALL
SELECT 'skills still /white', count(*)
FROM skills WHERE icon_url LIKE '%simpleicons.org/%/white'
UNION ALL
SELECT 'mcps still /white', count(*)
FROM imported_mcps WHERE icon_url LIKE '%simpleicons.org/%/white';
