-- Replace low-quality Google favicon URLs with GitHub org avatars
-- Run once to fix existing imported_mcps rows

UPDATE imported_mcps SET icon_url = 'https://github.com/aws.png?size=64'
WHERE name IN ('AWS', 'AWS API')
  AND icon_url LIKE '%google.com/s2/favicons%';

UPDATE imported_mcps SET icon_url = 'https://github.com/context7.png?size=64'
WHERE name = 'Context7'
  AND icon_url LIKE '%google.com/s2/favicons%';

UPDATE imported_mcps SET icon_url = 'https://github.com/neondatabase.png?size=64'
WHERE name = 'Neon'
  AND icon_url LIKE '%google.com/s2/favicons%';

UPDATE imported_mcps SET icon_url = 'https://github.com/exa-labs.png?size=64'
WHERE name = 'Exa'
  AND icon_url LIKE '%google.com/s2/favicons%';

UPDATE imported_mcps SET icon_url = 'https://github.com/mendableai.png?size=64'
WHERE name = 'Firecrawl'
  AND icon_url LIKE '%google.com/s2/favicons%';

UPDATE imported_mcps SET icon_url = 'https://github.com/microsoft.png?size=64'
WHERE name = 'Playwright'
  AND icon_url LIKE '%google.com/s2/favicons%';

UPDATE imported_mcps SET icon_url = 'https://github.com/slackapi.png?size=64'
WHERE name = 'Slack'
  AND icon_url LIKE '%google.com/s2/favicons%';

UPDATE imported_mcps SET icon_url = 'https://github.com/resend.png?size=64'
WHERE name = 'Resend'
  AND icon_url LIKE '%google.com/s2/favicons%';

UPDATE imported_mcps SET icon_url = 'https://github.com/openai.png?size=64'
WHERE name = 'OpenAI Agents'
  AND icon_url LIKE '%google.com/s2/favicons%';
