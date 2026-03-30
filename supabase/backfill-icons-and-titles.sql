-- ==========================================================================
-- Loop Backfill: icon_url column + updated titles/descriptions
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This script:
--   1. Adds icon_url column to skills and imported_mcps (migration 006)
--   2. Updates all 40 skill titles and descriptions to use brand-first naming
--   3. Sets icon_url to SimpleIcons CDN URLs for all skills
--   4. Sets icon_url to SimpleIcons CDN URLs for all MCPs
--
-- Safe to run multiple times (uses IF NOT EXISTS and upsert-style updates).
-- ==========================================================================

-- -------------------------------------------------------------------------
-- Step 1: Schema migration — add icon_url columns
-- -------------------------------------------------------------------------

ALTER TABLE skills ADD COLUMN IF NOT EXISTS icon_url text;
ALTER TABLE imported_mcps ADD COLUMN IF NOT EXISTS icon_url text;

-- -------------------------------------------------------------------------
-- Step 2: Backfill skill titles and descriptions
-- -------------------------------------------------------------------------

UPDATE skills SET title = 'Frontend Frontier',
  description = 'Art direction, motion systems, design-engineering references, and tokenized design systems built with Figma, Tailwind, and Motion.'
WHERE slug = 'frontend-frontier';

UPDATE skills SET title = 'Framer Motion',
  description = 'React animation with Framer Motion components, variants, gestures, layout animations, AnimatePresence, spring physics, and scroll effects.'
WHERE slug = 'motion-framer';

UPDATE skills SET title = 'GSAP + ScrollTrigger',
  description = 'Animation timelines, scroll-driven experiences, pinning, scrubbing, parallax, and cross-surface choreography with GSAP.'
WHERE slug = 'gsap-scrolltrigger';

UPDATE skills SET title = 'React Three Fiber',
  description = 'Declarative 3D scenes in React using R3F, drei helpers, and the Three.js ecosystem for product configurators, portfolios, and immersive experiences.'
WHERE slug = 'react-three-fiber';

UPDATE skills SET title = 'Tailwind Design System',
  description = 'Token-driven design systems with Tailwind CSS v4 @theme, CSS custom properties, and systematic spacing, color, and typography scales.'
WHERE slug = 'tailwind-design-system';

UPDATE skills SET title = 'Lighthouse Web Performance',
  description = 'Core Web Vitals via Google Lighthouse and Chrome DevTools: LCP, CLS, INP, bundle analysis, image optimization, caching strategies, and runtime profiling.'
WHERE slug = 'web-performance';

UPDATE skills SET title = 'WCAG Accessible UI',
  description = 'W3C WCAG 2.2 compliance, ARIA patterns, keyboard navigation, screen reader testing with VoiceOver and NVDA, focus management, and inclusive design.'
WHERE slug = 'accessible-ui';

UPDATE skills SET title = 'Next.js Patterns',
  description = 'App Router architecture, React Server Components, data fetching patterns, caching, middleware, and production deployment with Next.js.'
WHERE slug = 'nextjs-patterns';

UPDATE skills SET title = 'CSS Responsive Layouts',
  description = 'Responsive design with CSS container queries, fluid typography, modern CSS grid and flexbox patterns, and mobile-first development.'
WHERE slug = 'responsive-layouts';

UPDATE skills SET title = 'React Component Architecture',
  description = 'React component patterns: composition, compound components, render props, custom hooks, state management boundaries, and code organization.'
WHERE slug = 'component-architecture';

UPDATE skills SET title = 'Google SEO & GEO',
  description = 'On-page SEO for Google and generative-engine optimization for keyword placement, entity coverage, schema markup, AI citability, and crawler readiness.'
WHERE slug = 'seo-geo';

UPDATE skills SET title = 'Schema.org Markup',
  description = 'Schema.org JSON-LD structured data for Google rich snippets, knowledge panels, and AI search grounding — Article, Product, FAQ, HowTo, and more.'
WHERE slug = 'schema-markup';

UPDATE skills SET title = 'Google Technical SEO Audit',
  description = 'Google Search Console crawlability, indexing, site speed, canonicalization, robots.txt, sitemaps, and Core Web Vitals from the search infrastructure perspective.'
WHERE slug = 'technical-seo-audit';

UPDATE skills SET title = 'AI Citability & GEO',
  description = 'Generative engine optimization for AI search: making content citable by ChatGPT, Perplexity, Gemini, and Bing AI through entity density, structured answers, and llms.txt.'
WHERE slug = 'ai-citability';

UPDATE skills SET title = 'Ahrefs Keyword Research',
  description = 'Intent-mapped keyword clusters with Ahrefs and Semrush, competitor analysis, search volume prioritization, and content gap identification for SEO strategy.'
WHERE slug = 'keyword-research';

UPDATE skills SET title = 'Google Content SEO Strategy',
  description = 'Topic clusters for Google, content calendars, pillar-page architecture, internal linking strategy, and content lifecycle management for organic growth.'
WHERE slug = 'content-seo-strategy';

UPDATE skills SET title = 'X & LinkedIn Content OS',
  description = 'Strategy and operating system for X and LinkedIn — content pillars, ranked backlogs, recurring series, and proof-backed publishing workflows.'
WHERE slug = 'social-content-os';

UPDATE skills SET title = 'X & LinkedIn Social Draft',
  description = 'Platform-optimized drafting for X and LinkedIn — hooks, threading, tone calibration, and proof-backed posts that sound like a builder, not a content marketer.'
WHERE slug = 'social-draft';

UPDATE skills SET title = 'YouTube & X Audience Growth',
  description = 'Follower growth mechanics on YouTube and X, engagement optimization, reply strategies, collaboration tactics, and analytics-driven content iteration.'
WHERE slug = 'audience-growth';

UPDATE skills SET title = 'Content Repurposing',
  description = 'Multi-format content adaptation: turning one idea into blog posts, social threads, newsletter segments, video scripts, and documentation.'
WHERE slug = 'content-repurposing';

UPDATE skills SET title = 'Substack Newsletter Craft',
  description = 'Email newsletter writing with Substack and Resend, growth tactics, subject line optimization, audience segmentation, and retention strategies.'
WHERE slug = 'newsletter-craft';

UPDATE skills SET title = 'Cloudflare Edge Compute',
  description = 'Cloudflare Workers, Vercel Edge Functions, Deno Deploy — patterns for running code at the edge with low latency and global distribution.'
WHERE slug = 'edge-compute';

UPDATE skills SET title = 'Supabase Database Patterns',
  description = 'Supabase and Postgres best practices: connection pooling, RLS policies, migrations, indexing, query optimization, and schema design for web apps.'
WHERE slug = 'database-patterns';

UPDATE skills SET title = 'Grafana Observability Stack',
  description = 'Grafana, Prometheus, and Sentry — logging, tracing, alerting, and metrics for production systems with structured logs and distributed traces.'
WHERE slug = 'observability-stack';

UPDATE skills SET title = 'Vercel Serverless Architecture',
  description = 'Vercel Functions, AWS Lambda, and edge functions — API route patterns, cold start mitigation, Fluid Compute, and event-driven architectures.'
WHERE slug = 'serverless-architecture';

UPDATE skills SET title = 'Cloudflare CDN & Caching',
  description = 'Cloudflare and Vercel cache strategies, CDN configuration, stale-while-revalidate, cache invalidation, and edge caching for global delivery.'
WHERE slug = 'cdn-caching';

UPDATE skills SET title = 'Dockerfile Mastery',
  description = 'Multi-stage builds, layer optimization, caching, security hardening, and production-ready Dockerfile patterns for Node.js and web applications.'
WHERE slug = 'dockerfile-mastery';

UPDATE skills SET title = 'Kubernetes Essentials',
  description = 'Pods, services, deployments, ingress, ConfigMaps, health checks, and resource management for Kubernetes-based deployments.'
WHERE slug = 'kubernetes-essentials';

UPDATE skills SET title = 'Snyk Container Security',
  description = 'Snyk and Trivy image scanning, runtime policies, non-root execution, secrets management, and supply chain security for containers.'
WHERE slug = 'container-security';

UPDATE skills SET title = 'OpenAI Agent Orchestration',
  description = 'OpenAI and Anthropic multi-agent patterns, handoff protocols, tool routing, state management, and coordination strategies for AI agent systems.'
WHERE slug = 'agent-orchestration';

UPDATE skills SET title = 'Anthropic MCP Development',
  description = 'Building Anthropic Model Context Protocol servers and clients — tool definitions, resource exposure, transport layers, and integration patterns.'
WHERE slug = 'mcp-development';

UPDATE skills SET title = 'OpenAI Prompt Engineering',
  description = 'System prompts for OpenAI and Claude, few-shot examples, chain-of-thought, structured outputs, and prompt optimization for production AI.'
WHERE slug = 'prompt-engineering';

UPDATE skills SET title = 'Tool Use & Function Calling',
  description = 'OpenAI and Anthropic function calling, structured outputs, tool selection strategies, error recovery, and composable tool chains for AI agents.'
WHERE slug = 'tool-use-patterns';

UPDATE skills SET title = 'OpenAI RAG Pipelines',
  description = 'Retrieval-augmented generation with OpenAI embeddings and Pinecone: chunking strategies, vector search, context window management, and hybrid search.'
WHERE slug = 'rag-pipelines';

UPDATE skills SET title = 'OWASP Security Best Practices',
  description = 'OWASP secure coding defaults for web applications: input validation, output encoding, authentication, authorization, and dependency management.'
WHERE slug = 'security-best-practices';

UPDATE skills SET title = 'OWASP Threat Modeling',
  description = 'OWASP threat modeling methodology: trust boundaries, asset inventory, STRIDE analysis, abuse paths, and structured mitigation planning.'
WHERE slug = 'security-threat-model';

UPDATE skills SET title = 'Clerk Auth Patterns',
  description = 'Clerk, Auth0, and OAuth authentication patterns: JWT, sessions, RBAC, Supabase row-level security, and multi-tenant access control for web apps.'
WHERE slug = 'auth-patterns';

UPDATE skills SET title = 'OAuth & JWT API Security',
  description = 'OAuth 2.0, JWT verification, rate limiting, input validation, CORS configuration, API key management, webhook verification, and abuse prevention.'
WHERE slug = 'api-security';

UPDATE skills SET title = 'GitHub Actions CI',
  description = 'CI/CD workflows with GitHub Actions: test pipelines, build caching, deployment automation, matrix builds, and reusable workflows.'
WHERE slug = 'gh-actions-ci';

UPDATE skills SET title = 'GitHub Release Management',
  description = 'GitHub Releases, semantic versioning, changelogs, release automation, Vercel feature flags, canary deployments, and rollback strategies.'
WHERE slug = 'release-management';

-- -------------------------------------------------------------------------
-- Step 3: Backfill skill icon_url via SimpleIcons CDN
--
-- These use cdn.simpleicons.org direct URLs (official brand colors).
-- For production, run `npx tsx lib/db/seed-icons.ts` instead to upload
-- SVGs to your Supabase Storage bucket for self-hosted URLs.
-- -------------------------------------------------------------------------

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/figma'
WHERE slug = 'frontend-frontier' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/framer'
WHERE slug = 'motion-framer' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/greensock'
WHERE slug = 'gsap-scrolltrigger' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/threedotjs'
WHERE slug = 'react-three-fiber' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/tailwindcss'
WHERE slug = 'tailwind-design-system' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/lighthouse'
WHERE slug = 'web-performance' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://www.google.com/s2/favicons?domain=w3.org&sz=64'
WHERE slug = 'accessible-ui' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/nextdotjs'
WHERE slug = 'nextjs-patterns' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/css'
WHERE slug = 'responsive-layouts' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/react'
WHERE slug = 'component-architecture' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/google'
WHERE slug = 'seo-geo' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://www.google.com/s2/favicons?domain=schema.org&sz=64'
WHERE slug = 'schema-markup' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/google'
WHERE slug = 'technical-seo-audit' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://www.google.com/s2/favicons?domain=openai.com&sz=64'
WHERE slug = 'ai-citability' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/semrush'
WHERE slug = 'keyword-research' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/google'
WHERE slug = 'content-seo-strategy' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/x'
WHERE slug = 'social-content-os' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/buffer'
WHERE slug = 'social-draft' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/youtube'
WHERE slug = 'audience-growth' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/notion'
WHERE slug = 'content-repurposing' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/substack'
WHERE slug = 'newsletter-craft' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/cloudflare'
WHERE slug = 'edge-compute' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/supabase'
WHERE slug = 'database-patterns' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/grafana'
WHERE slug = 'observability-stack' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/vercel'
WHERE slug = 'serverless-architecture' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/cloudflare'
WHERE slug = 'cdn-caching' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/docker'
WHERE slug = 'dockerfile-mastery' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/kubernetes'
WHERE slug = 'kubernetes-essentials' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/snyk'
WHERE slug = 'container-security' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://www.google.com/s2/favicons?domain=openai.com&sz=64'
WHERE slug = 'agent-orchestration' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/anthropic'
WHERE slug = 'mcp-development' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://www.google.com/s2/favicons?domain=openai.com&sz=64'
WHERE slug = 'prompt-engineering' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/anthropic'
WHERE slug = 'tool-use-patterns' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://www.google.com/s2/favicons?domain=openai.com&sz=64'
WHERE slug = 'rag-pipelines' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/owasp'
WHERE slug = 'security-best-practices' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/owasp'
WHERE slug = 'security-threat-model' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/clerk'
WHERE slug = 'auth-patterns' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/auth0'
WHERE slug = 'api-security' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/githubactions'
WHERE slug = 'gh-actions-ci' AND icon_url IS NULL;

UPDATE skills SET icon_url = 'https://cdn.simpleicons.org/github'
WHERE slug = 'release-management' AND icon_url IS NULL;

-- -------------------------------------------------------------------------
-- Step 4: Backfill MCP icon_url via SimpleIcons CDN
-- -------------------------------------------------------------------------

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/files'
WHERE name = 'Filesystem' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/databricks'
WHERE name = 'Memory' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/openmined'
WHERE name = 'Sequential Thinking' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/curl'
WHERE name = 'Fetch' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/git'
WHERE name = 'Git' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/github'
WHERE name = 'GitHub' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/vercel'
WHERE name = 'Vercel' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/cloudflare'
WHERE name = 'Cloudflare' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/sentry'
WHERE name = 'Sentry' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/supabase'
WHERE name = 'Supabase' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://www.google.com/s2/favicons?domain=neon.tech&sz=64'
WHERE name = 'Neon' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/prisma'
WHERE name = 'Prisma' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/turso'
WHERE name = 'Turso' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/upstash'
WHERE name = 'Upstash' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://www.google.com/s2/favicons?domain=context7.com&sz=64'
WHERE name = 'Context7' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/brave'
WHERE name = 'Brave Search' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://www.google.com/s2/favicons?domain=exa.ai&sz=64'
WHERE name = 'Exa' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://www.google.com/s2/favicons?domain=firecrawl.dev&sz=64'
WHERE name = 'Firecrawl' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://www.google.com/s2/favicons?domain=playwright.dev&sz=64'
WHERE name = 'Playwright' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/puppeteer'
WHERE name = 'Puppeteer' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/notion'
WHERE name = 'Notion' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://www.google.com/s2/favicons?domain=slack.com&sz=64'
WHERE name = 'Slack' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/linear'
WHERE name = 'Linear' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/todoist'
WHERE name = 'Todoist' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/stripe'
WHERE name = 'Stripe' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/figma'
WHERE name = 'Figma' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://www.google.com/s2/favicons?domain=resend.com&sz=64'
WHERE name = 'Resend' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/grafana'
WHERE name = 'Grafana' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://www.google.com/s2/favicons?domain=openai.com&sz=64'
WHERE name = 'OpenAI Agents' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/postgresql'
WHERE name = 'PostgreSQL' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/sqlite'
WHERE name = 'SQLite' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=64'
WHERE name = 'AWS' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/terraform'
WHERE name = 'Terraform' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/docker'
WHERE name = 'Docker' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/kubernetes'
WHERE name = 'Kubernetes' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/snyk'
WHERE name = 'Snyk' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/fastapi'
WHERE name = 'MCP Proxy' AND icon_url IS NULL;

UPDATE imported_mcps SET icon_url = 'https://cdn.simpleicons.org/clockify'
WHERE name = 'Time' AND icon_url IS NULL;

-- -------------------------------------------------------------------------
-- Step 5: Verification queries (run these to confirm)
-- -------------------------------------------------------------------------

-- Check skills with icons
SELECT slug, title, icon_url IS NOT NULL AS has_icon
FROM skills
ORDER BY slug;

-- Check MCPs with icons
SELECT name, icon_url IS NOT NULL AS has_icon
FROM imported_mcps
ORDER BY name;

-- Summary counts
SELECT
  (SELECT count(*) FROM skills WHERE icon_url IS NOT NULL) AS skills_with_icons,
  (SELECT count(*) FROM skills) AS total_skills,
  (SELECT count(*) FROM imported_mcps WHERE icon_url IS NOT NULL) AS mcps_with_icons,
  (SELECT count(*) FROM imported_mcps) AS total_mcps;
