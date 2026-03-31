import type { CreateSkillInput } from "@/lib/db/skills";

type SeedSkill = Omit<CreateSkillInput, "origin"> & {
  origin?: CreateSkillInput["origin"];
};

// ---------------------------------------------------------------------------
// Social (5)
// ---------------------------------------------------------------------------

const socialContentOs: SeedSkill = {
  slug: "social-content-os",
  title: "X & LinkedIn Content OS",
  category: "social",
  accent: "signal-gold",
  featured: true,
  visibility: "public",
  tags: ["content", "distribution", "strategy", "backlog", "pillars"],
  description:
    "Strategy and operating system for X and LinkedIn — content pillars, ranked backlogs, recurring series, and proof-backed publishing workflows.",
  body: `# X & LinkedIn Content OS

Strategy and operating system for building a repeatable, proof-backed publishing practice on X and LinkedIn.

## When to use

- You are starting or rebooting a professional social presence on X or LinkedIn
- You need a system that turns project work into a steady content pipeline
- You want to move beyond ad-hoc posting toward a structured publishing cadence
- You are a builder, engineer, or founder who wants to share work-in-public
- You need to coordinate content across X and LinkedIn without duplicating effort

## When NOT to use

- You need help with paid social ads or sponsored campaigns — this is organic only
- You want a viral-at-all-costs growth hack — this is steady-state compounding
- The platform is TikTok, YouTube, or Instagram — see platform-specific skills
- You need brand-level governance for a team of 10+ contributors — use a CMS
- You are ghostwriting for someone else with no access to their real work

## Core concepts

### Content pillars

Pillars are 3–5 recurring themes that define what you are known for. Every post maps to exactly one pillar.

| Pillar type | Example | Cadence hint |
|-------------|---------|--------------|
| Build log | "Shipped X this week" — demos, screenshots, architecture decisions | 2–3×/week |
| Sharp take | Opinionated stance on industry topic backed by experience | 1×/week |
| Playbook | Step-by-step how-to distilled from real work | 1×/week |
| Signal boost | Curated link + your 2-sentence take on why it matters | 1–2×/week |
| Personal proof | Metrics, before/after, lessons from failure | 1×/2 weeks |

**Rule of thumb:** if you cannot explain a pillar in one sentence to a stranger, it is too vague.

### Ranked backlog

A single prioritized list of content ideas, scored by:

\\\`\\\`\\\`
score = (relevance_to_pillar × 3) + (proof_available × 2) + (timeliness × 1)
\\\`\\\`\\\`

Each item has: one-line hook, target pillar, platform (X / LinkedIn / both), proof artifact (screenshot, metric, link), and estimated effort (S / M / L).

### Recurring series

Named series create audience expectation and reduce creative overhead:

- **"Monday build log"** — what shipped, what broke, what is next
- **"Friday link drop"** — 3 curated links with micro-takes
- **"Deep dive Thursday"** — long-form LinkedIn article or X thread

### Publishing workflow

1. **Capture** — dump raw ideas into backlog within 2 minutes of occurrence
2. **Score** — weekly 15-min session to rank top 7 backlog items
3. **Draft** — write post body, attach proof artifact, tag pillar
4. **Platform-fit** — adapt tone and format (X: punchy, threaded; LinkedIn: narrative, paragraph)
5. **Schedule** — slot into calendar; mornings (7–9 AM local) for X, Tue/Wed/Thu for LinkedIn
6. **Publish + engage** — post, then spend 15 min replying in the first hour
7. **Measure** — weekly review of impressions, engagement rate, profile visits, follower delta

## Workflow

### Step 1 — Define pillars

Write 3–5 pillars. For each, list 3 example post ideas to validate the pillar is fertile.

**Template:**

\\\`\\\`\\\`
Pillar: [Name]
One-liner: [What this pillar is about in ≤15 words]
Example posts:
  1. [Idea]
  2. [Idea]
  3. [Idea]
\\\`\\\`\\\`

### Step 2 — Seed the backlog

Brainstorm 15–20 ideas. Score each. Sort descending. The top 7 become your first two weeks of content.

### Step 3 — Set cadence

Map days of the week to pillars. Example:

| Day | X | LinkedIn |
|-----|---|----------|
| Mon | Build log thread | — |
| Tue | Sharp take (single post) | Build log article |
| Wed | Signal boost | Playbook post |
| Thu | — | Deep dive article |
| Fri | Link drop thread | — |
| Sat | Personal proof (optional) | — |

### Step 4 — Draft in batches

Block 90 minutes on Sunday to draft 5 posts from the top of the backlog. Store drafts in a shared doc or scheduling tool (Typefully, Buffer, or native drafts).

### Step 5 — Weekly review

Every Friday, spend 15 minutes:

1. Record metrics: impressions, engagement rate, follower delta
2. Note top-performing post and hypothesize why
3. Promote 2 backlog ideas that relate to what performed
4. Archive stale ideas (>4 weeks old, no longer timely)

## Examples

### Example pillar set for an AI engineer

| Pillar | One-liner |
|--------|-----------|
| Build log | What I shipped this week in my AI agent project |
| Sharp take | Opinions on prompt engineering, evals, and model selection |
| Playbook | Step-by-step guides from real agent implementations |
| Signal boost | Papers, tools, and launches worth paying attention to |

### Example backlog item

\\\`\\\`\\\`
Hook: "I replaced 400 lines of LangChain with 50 lines of raw SDK calls. Here's what I learned."
Pillar: Sharp take
Platform: X thread + LinkedIn adaptation
Proof: Before/after code screenshots, latency benchmarks
Effort: M
Score: (3×3) + (2×2) + (1×1) = 14
\\\`\\\`\\\`

### Example weekly metrics log

\\\`\\\`\\\`
Week of Mar 24:
  X impressions: 42,000 (+18%)
  X engagement rate: 4.2%
  LinkedIn impressions: 8,500 (+12%)
  LinkedIn engagement rate: 6.1%
  Follower delta: +340 (X), +85 (LinkedIn)
  Top post: "400 lines of LangChain" thread (X) — 12K impressions
  Hypothesis: Contrarian takes with code screenshots outperform pure text
  Action: Promote 2 similar backlog items to top of queue
\\\`\\\`\\\`

## Decision tree

1. **Have I defined pillars?** No → Step 1. Yes → continue.
2. **Is my backlog scored and sorted?** No → Step 2. Yes → continue.
3. **Do I have a weekly cadence mapped?** No → Step 3. Yes → continue.
4. **Are drafts batched ahead of time?** No → Step 4. Yes → continue.
5. **Am I reviewing metrics weekly?** No → Step 5. Yes → maintain and iterate.
6. **Is engagement plateauing?** Yes → rotate one pillar, test a new series format.
7. **Am I burning out?** Yes → reduce to 3 posts/week, keep only highest-ROI pillar.

## Edge cases and gotchas

- **Pillar overlap** — if two pillars produce identical posts, merge them. Four strong pillars beat five blurry ones.
- **Platform tone mismatch** — do not copy-paste X posts to LinkedIn verbatim. X rewards density and edge; LinkedIn rewards narrative and vulnerability.
- **Vanity metrics** — impressions without profile visits or follower growth mean the content entertains but does not convert. Tighten the hook-to-CTA path.
- **Consistency > virality** — one viral post followed by two weeks of silence loses more followers than it gains. The system is the asset.
- **Proof debt** — if you have no screenshots, metrics, or artifacts, you are not building in public — you are opining. Prioritize posts where you have receipts.
- **Engagement window** — the first 60 minutes after posting on X are critical for algorithmic reach. Do not post and disappear.
- **LinkedIn algorithm shift** — LinkedIn currently rewards native documents (PDFs), carousels, and long text posts over external links. Adapt format accordingly.
- **Batch rot** — drafts older than 10 days lose timeliness. Re-score before publishing.

## Evaluation criteria

| Metric | Poor | Acceptable | Strong |
|--------|------|------------|--------|
| Weekly post count | <2 | 3–5 | 6–8 |
| X engagement rate | <1% | 2–4% | >5% |
| LinkedIn engagement rate | <2% | 4–6% | >8% |
| Backlog depth | <5 ideas | 10–20 ideas | 20+ scored ideas |
| Pillar coverage | 1 pillar dominates | 2–3 active | All pillars active weekly |
| Follower growth (weekly) | Flat | 1–2% | >3% |
| Content reuse rate | 0% | 20–30% repurposed | 40%+ cross-platform |`,
  agentDocs: {
    codex: `# Codex — X & LinkedIn Content OS

## Purpose
Guide the agent to help users build and maintain a structured social content system.

## Behavior rules
- When the user asks to "plan content" or "set up a content system," activate this skill
- Always start by asking for or generating content pillars before any drafting
- Require at least 3 pillars with example posts before proceeding
- Generate backlog items with the scoring formula: (relevance×3) + (proof×2) + (timeliness×1)
- Never generate posts without mapping them to a specific pillar
- Always include a proof artifact suggestion (screenshot, metric, link) for each backlog item
- When reviewing performance, ask for actual metrics — do not fabricate engagement numbers
- Suggest cadence based on the user's stated capacity, not an ideal maximum
- Default to platform-specific formatting: X gets threads and punchy hooks; LinkedIn gets narrative paragraphs
- Flag backlog items older than 2 weeks for re-scoring

## Output format
- Pillar definitions: table with name, one-liner, 3 example ideas
- Backlog items: hook, pillar, platform, proof artifact, effort, score
- Weekly plans: day-by-day calendar with pillar assignments
- Reviews: metrics table + top post analysis + action items

## Constraints
- Do not generate content for platforms other than X and LinkedIn unless explicitly asked
- Do not recommend paid promotion — this skill is organic-only
- Do not fabricate metrics or follower counts
- Refuse to generate posts that lack a clear pillar mapping`,
    cursor: `# Cursor — X & LinkedIn Content OS

## When to activate
- User opens or references social content planning files
- User asks for content calendar, pillar definitions, or backlog management
- User requests help organizing social media strategy

## Inline behavior
- Autocomplete pillar definitions using the template format from the skill body
- Suggest backlog scoring when the user adds raw content ideas
- Lint content plans for: missing pillars, unscored items, >10-day-old drafts
- Offer platform-specific formatting suggestions when drafting
- Warn when a draft does not map to any defined pillar

## Code generation
- Generate markdown templates for weekly content calendars
- Create structured backlog files with scoring columns
- Produce metrics tracking templates with week-over-week deltas

## Completions
- When typing a pillar name, suggest related post hooks from the backlog
- When scheduling, suggest optimal posting times (7–9 AM for X, Tue–Thu for LinkedIn)
- Autocomplete series names ("Monday build log," "Friday link drop")

## Diagnostics
- Flag pillars with zero posts in the last 2 weeks as "dormant"
- Warn if weekly post count drops below the user's stated cadence
- Highlight backlog items with no proof artifact attached`,
    claude: `# Claude — X & LinkedIn Content OS

## Role
Act as a content strategist helping the user build a systematic social publishing practice.

## Conversation patterns
- When asked to "help with social media," clarify whether the user needs strategy (this skill) or drafting (social-draft skill)
- Always ground advice in the user's actual work — ask what they are building before suggesting pillars
- Propose pillars as hypotheses and ask the user to validate with 3 example post ideas each
- When reviewing content plans, check for pillar balance and suggest rotation if one pillar dominates

## Generation rules
- Generate backlog items in the structured format: hook, pillar, platform, proof, effort, score
- Always provide a scoring rationale when ranking backlog items
- When creating weekly plans, respect the user's stated posting capacity
- Adapt tone guidance: X = punchy, direct, builder-voice; LinkedIn = narrative, reflective, professional
- Include specific proof artifact suggestions — not just "add a screenshot" but "screenshot of the dashboard showing the 3x latency improvement"

## Guardrails
- Never fabricate engagement metrics or follower projections
- Do not recommend posting frequency higher than what the user can sustain
- Refuse to create content that cannot be backed by real work or real opinions
- When the user has no proof artifacts, suggest building them first before drafting
- Redirect viral-chasing requests toward consistency-based growth

## Evaluation
- Assess content plans against the evaluation criteria table in the skill body
- Highlight the weakest metric area and suggest one specific improvement`,
    agents: `# AGENTS.md — X & LinkedIn Content OS

## Review checklist
- Are content pillars defined with clear one-liner descriptions?
- Does every post in the plan map to exactly one pillar?
- Is the backlog scored and sorted, not just a flat list of ideas?
- Does each backlog item have a proof artifact (screenshot, metric, code, link)?
- Is the posting cadence realistic for the user's stated capacity?
- Are X and LinkedIn posts adapted for platform-specific tone and format?
- Is there a weekly review process with actual metrics, not gut feel?
- Are series named and recurring, creating audience expectation?

## Quality gates
- Reject content plans with fewer than 3 defined pillars
- Reject backlog items with no proof artifact and no plan to create one
- Flag any post that reads the same on X and LinkedIn — platform adaptation is required
- Require at least one week of metrics data before making strategy changes
- Ensure the content-to-engagement ratio is tracked, not just impressions

## Anti-patterns to flag
- Posting the same text verbatim to both platforms
- All posts from a single pillar (pillar collapse)
- Backlog items with no scoring (unranked idea dumps)
- Publishing without engaging in replies for the first hour
- Chasing trending topics that do not connect to any pillar`
  }
};

const socialDraft: SeedSkill = {
  slug: "social-draft",
  title: "X & LinkedIn Social Draft",
  category: "social",
  accent: "signal-gold",
  featured: true,
  visibility: "public",
  tags: ["drafting", "copy", "x", "linkedin", "hooks"],
  description:
    "Platform-optimized drafting for X and LinkedIn — hooks, threading, tone calibration, and proof-backed posts that sound like a builder, not a content marketer.",
  body: `# X & LinkedIn Social Draft

Platform-optimized drafting craft for X and LinkedIn. Write posts that sound like a builder sharing real work, not a content marketer optimizing engagement bait.

## When to use

- You have a content idea scored and ready to draft (ideally from the Content OS backlog)
- You need to write an X thread, single tweet, or LinkedIn post
- You want to adapt a single idea for both X and LinkedIn
- You need help calibrating tone between platforms
- You are drafting a recurring series post (build log, link drop, deep dive)

## When NOT to use

- You need content strategy or pillar planning — use social-content-os
- You are writing long-form blog posts or documentation — this is social-native copy
- You need video scripts — see video-specific skills
- You are drafting email newsletters — use newsletter-craft
- The post has no connection to real work, opinions, or proof

## Core concepts

### The hook

The first line is the entire post for 90% of readers. It must earn the click to expand.

**Hook patterns that work for builders:**

| Pattern | Example | Why it works |
|---------|---------|-------------|
| Contrarian claim | "Most RAG implementations are over-engineered. Here's proof." | Creates tension, promises evidence |
| Metric lead | "Cut our API latency from 2.3s to 180ms. The fix was embarrassing." | Specificity + curiosity gap |
| Before/after | "Before: 400 lines of glue code. After: 50 lines of raw SDK." | Visual contrast, implies a lesson |
| Direct how-to | "How to set up evals for your AI agent in 30 minutes." | Clear value proposition, specific time |
| Question hook | "Why do most AI startups ignore evals until it's too late?" | Engages reader's own experience |
| Story opener | "Last Tuesday our production agent hallucinated a customer's name. Here's what we did." | Narrative pull, vulnerability |

**Anti-patterns:**

- "I'm excited to announce…" — nobody cares about your excitement, lead with the thing
- "Thread 🧵" — the reader can see it is a thread, do not waste the hook
- Starting with "So…" or "Alright…" — filler words burn the most valuable real estate
- Humble-brag framing — "I can't believe this happened…" — just state the result

### X drafting rules

**Single post (≤280 chars):**
- One idea, one sentence, one punch
- End with a perspective, not a question (questions get ignored on X unless you have >10K followers)
- No hashtags unless they are genuinely part of the sentence

**Thread (3–12 posts):**
1. **Post 1 (hook):** standalone insight or claim that makes sense without the thread
2. **Posts 2–N:** one idea per post, each readable in isolation
3. **Final post:** actionable takeaway, CTA (follow, bookmark, reply), or the single most important sentence restated
4. Use line breaks between sentences — X readers scan, they do not read
5. Number posts only if the order is sequential and matters (steps, timelines)

**Thread pacing template:**

\\\`\\\`\\\`
Post 1: Hook — the bold claim or result
Post 2: Context — what problem existed
Post 3: What we tried first (and why it failed)
Post 4: The actual solution (with specifics)
Post 5: Result — metrics, before/after, proof
Post 6: Takeaway — the generalizable lesson
Post 7: CTA — what the reader should do next
\\\`\\\`\\\`

### LinkedIn drafting rules

**Format:**
- Lead with a hook line, then a line break (LinkedIn truncates after ~3 lines)
- Short paragraphs (1–3 sentences max)
- Use white space aggressively — LinkedIn is a mobile-first feed
- Bold or caps for one key phrase per post, not more
- End with a question or explicit CTA to drive comments

**Tone:**
- More narrative than X — tell the story, not just the result
- Vulnerability works: "I was wrong about X" outperforms "Here's why X is right"
- Professional but human — write like you would explain to a respected peer over coffee
- Avoid jargon walls — LinkedIn audiences are broader than X tech audiences

**LinkedIn-specific formats that perform:**

| Format | Best for | Template |
|--------|----------|----------|
| Listicle | Playbooks, curated lists | "7 things I learned building [X]" + numbered list |
| Carousel (PDF) | Step-by-step guides | 8–12 slides, 1 idea per slide, bold headline + short body |
| Story arc | Personal proof, lessons | Setup → Conflict → Resolution → Takeaway |
| Hot take + context | Sharp takes | Bold claim → 3 paragraphs of reasoning → "Agree or disagree?" |

### Tone calibration

| Dimension | X tone | LinkedIn tone |
|-----------|--------|--------------|
| Length | Dense, compressed | Expanded, narrative |
| Vulnerability | Acceptable in small doses | Actively rewarded |
| Technical depth | High — audience expects it | Medium — broader audience |
| Self-reference | Minimal — let the work speak | Expected — personal stories win |
| CTA style | "Bookmark this" / "Follow for more" | "What's your experience?" / "Drop your take" |
| Humor | Dry, terse | Warm, self-deprecating |
| Proof format | Screenshots, code blocks | Metrics, timelines, before/after narratives |

### Proof-backed writing

Every strong post has a proof artifact:

- **Screenshot:** Dashboard, code diff, terminal output, UI before/after
- **Metric:** Specific number with context ("3x faster" means nothing without "from 2.3s to 0.7s")
- **Link:** To the repo, the deployed thing, the paper
- **Quote:** From a user, a teammate, or a respected source

**Rule:** If you cannot point to proof, you are writing an opinion piece. Label it as such.

## Workflow

### Step 1 — Pull from backlog

Select the top-scored backlog item. Confirm it has: hook idea, target pillar, target platform, proof artifact.

### Step 2 — Write the hook

Draft 3 hook variants using different patterns from the hook table. Pick the one with the strongest specificity-to-curiosity ratio.

### Step 3 — Draft body

For X threads: one idea per post, proof in the middle, takeaway at the end.
For LinkedIn: narrative arc with white space, proof embedded as a story beat.

### Step 4 — Tone check

Read the draft aloud. If it sounds like a press release, rewrite. If it sounds like you explaining to a friend, ship it.

### Step 5 — Platform adapt

If posting to both platforms: write the X version first (constraint forces clarity), then expand for LinkedIn (narrative, context, softer CTA).

### Step 6 — Proof attach

Add the proof artifact. For X: screenshot or code image. For LinkedIn: embed the metric or tell the story around it.

### Step 7 — Schedule

X: 7–9 AM or 12–1 PM local time. LinkedIn: Tue/Wed/Thu, 8–10 AM local. Avoid weekends for LinkedIn.

## Examples

### Example X thread (5 posts)

\\\`\\\`\\\`
Post 1:
I replaced our entire RAG pipeline with 50 lines of code.

It's faster, cheaper, and more accurate.

Here's exactly how:

Post 2:
The old setup:
- LangChain orchestration
- Pinecone vector store
- Custom reranker
- 400 lines of glue code
- 2.3s average latency

It worked. But maintaining it was a nightmare.

Post 3:
The new setup:
- OpenAI Responses API with file_search
- Native vector store
- 50 lines of code
- 180ms average latency

The key insight: the platform caught up to our custom stack.

Post 4:
Results after 2 weeks:
- Latency: 2.3s → 180ms (12x faster)
- Cost: $0.04/query → $0.01/query
- Accuracy: 87% → 91% (better retrieval)
- Lines of code: 400 → 50

Screenshot of the dashboard attached.

Post 5:
Takeaway: Re-evaluate your stack every 6 months.

The best architecture is the one you delete
because the platform made it unnecessary.

Follow for more AI engineering build logs.
\\\`\\\`\\\`

### Example LinkedIn post

\\\`\\\`\\\`
I spent 6 months building a custom RAG pipeline.

Last week, I deleted most of it.

Here's why that's a good thing:

When we started, there was no native file search in the OpenAI API.
So we built our own: LangChain for orchestration, Pinecone for vectors,
a custom reranker, and 400 lines of glue code.

It worked. Our accuracy hit 87%. Latency was 2.3 seconds.
Good enough for our use case.

Then the Responses API shipped with built-in file_search.

I rewrote the entire pipeline in an afternoon:
→ 50 lines of code
→ 180ms latency (12x improvement)
→ 91% accuracy
→ 75% cost reduction

The lesson isn't "don't build custom infrastructure."

The lesson is: the best architecture is the one you're willing to delete
when something better comes along.

What's the last piece of infrastructure you deleted because the platform caught up?
\\\`\\\`\\\`

## Decision tree

1. **Do I have a scored backlog item?** No → go to Content OS. Yes → continue.
2. **Is the target platform X, LinkedIn, or both?** Pick one to draft first.
3. **Do I have a proof artifact?** No → create one or switch to opinion framing. Yes → continue.
4. **Is the idea a single point or a multi-step story?** Single → X single post or LinkedIn short. Multi → X thread or LinkedIn long.
5. **Am I adapting for both platforms?** Yes → write X first (tighter), expand for LinkedIn.
6. **Does the hook pass the "would I click expand?" test?** No → rewrite with a different hook pattern. Yes → ship.

## Edge cases and gotchas

- **Thread fatigue** — X threads longer than 10 posts lose readers exponentially after post 5. If it is longer, break it into a series.
- **LinkedIn link penalty** — LinkedIn suppresses posts with external links. Put the link in the first comment, not the post body.
- **Self-promotion ratio** — keep the ratio at roughly 4:1 (value posts to promotional posts). If every post pitches your product, engagement craters.
- **Cross-post detection** — audiences on both platforms notice identical copy. Adapt, do not copy-paste.
- **Image alt text** — X does not auto-generate alt text for images. Add it manually for accessibility and SEO.
- **Quote-tweet trap** — on X, quote-tweeting someone with "This" or "+1" adds no value. Add your own take or just retweet.
- **LinkedIn engagement pods** — artificial engagement groups damage reach long-term. Build real engagement through replies.
- **Thread numbering** — only number X thread posts if order matters (steps, timelines). Numbered lists feel corporate otherwise.
- **Hook recycling** — reusing the same hook pattern repeatedly trains your audience to scroll past. Rotate patterns weekly.

## Evaluation criteria

| Metric | Poor | Acceptable | Strong |
|--------|------|------------|--------|
| Hook click-through (expand rate) | <5% | 8–15% | >20% |
| X thread completion rate | <30% | 40–60% | >70% |
| LinkedIn comment count | 0–2 | 5–15 | >20 |
| Proof artifact present | No | Screenshot only | Metric + screenshot + link |
| Platform adaptation | Copy-paste | Minor tweaks | Fully rewritten for each platform |
| Tone accuracy | Sounds like marketing | Sounds professional | Sounds like a builder talking to peers |
| CTA effectiveness | No CTA | Generic "follow me" | Specific, contextual CTA |`,
  agentDocs: {
    codex: `# Codex — X & LinkedIn Social Draft

## Purpose
Guide the agent to draft platform-optimized social posts grounded in real work and proof.

## Behavior rules
- When the user asks to "write a post" or "draft a thread," activate this skill
- Always ask for the proof artifact before drafting — refuse to draft without one
- Generate 3 hook variants using different patterns from the hook table
- Draft X posts first (the constraint forces clarity), then expand for LinkedIn
- Enforce platform-specific formatting: line breaks for X, white space for LinkedIn
- Never start a post with "I'm excited to announce" or "Thread 🧵"
- Include the proof artifact placement in every draft
- Maintain builder voice: direct, specific, opinionated, not self-promotional
- When adapting for both platforms, produce two distinct drafts — never one copy-pasted version
- Flag posts that have no proof artifact and offer to reframe as an opinion piece

## Output format
- Hook variants: numbered list with pattern label
- X threads: numbered posts, each ≤280 chars, with line breaks
- LinkedIn posts: paragraph format with explicit white space markers
- Both: proof artifact placement noted inline

## Constraints
- Do not fabricate metrics or proof artifacts
- Do not use hashtags on X unless they are part of the sentence
- Do not include external links in LinkedIn post body — suggest first-comment placement
- Maximum X thread length: 10 posts unless the user explicitly wants longer
- Refuse to draft posts that are pure self-promotion with no value to the reader`,
    cursor: `# Cursor — X & LinkedIn Social Draft

## When to activate
- User is editing a social media draft file
- User requests help writing X threads, tweets, or LinkedIn posts
- User asks for hook suggestions or tone calibration

## Inline behavior
- Autocomplete hook patterns when the user starts a post with common openers
- Suggest proof artifact placement when a post references results without evidence
- Lint drafts for: filler openers ("So…", "Alright…"), missing proof, >280 chars per X post
- Warn when X and LinkedIn drafts are identical (cross-post detection)
- Suggest line breaks for X threads when sentences run together

## Code generation
- Generate markdown templates for X threads (numbered posts with character counts)
- Create LinkedIn post templates with white space formatting
- Produce hook variant generators from a single topic input

## Completions
- When typing a hook, suggest alternative patterns from the hook table
- When writing a CTA, suggest platform-appropriate options
- Autocomplete series templates ("Monday build log," "Deep dive Thursday")
- Suggest optimal posting times based on platform

## Diagnostics
- Flag posts exceeding 280 characters per X tweet
- Warn on posts with no proof artifact reference
- Detect marketing-speak tone and suggest builder-voice rewrites
- Highlight LinkedIn posts with external links in the body (suggest comment placement)
- Flag hook patterns that the user has used in the last 5 posts (pattern fatigue)`,
    claude: `# Claude — X & LinkedIn Social Draft

## Role
Act as a drafting partner who helps the user write social posts that sound authentic to their builder voice.

## Conversation patterns
- When asked to "write a post," always ask: What did you build/learn/observe? What proof do you have?
- Generate 3 hook variants and let the user choose before writing the full draft
- When adapting between platforms, explain the specific changes and why each fits the platform
- If the user provides no proof artifact, offer to reframe as an opinion piece or suggest what proof to create

## Generation rules
- Draft X posts at ≤280 characters per tweet, with line breaks between sentences
- Draft LinkedIn posts with short paragraphs (1–3 sentences) and generous white space
- Always include proof artifact placement: "[SCREENSHOT: dashboard showing latency drop]"
- Use the builder voice: direct, specific, opinionated, not corporate
- Never use filler openers, false excitement, or generic CTAs
- When drafting threads, make each post independently readable (someone might screenshot post 4)
- End X threads with the single strongest takeaway restated, not a weak "thoughts?"
- End LinkedIn posts with a specific question that invites genuine experience-sharing

## Guardrails
- Refuse to draft posts with fabricated metrics or unverifiable claims
- Never produce identical copy for X and LinkedIn — always adapt
- Flag self-promotion ratio: if >25% of recent drafts are promotional, suggest value-first alternatives
- Do not add hashtags to X posts unless the user specifically requests them
- If the user's draft sounds like marketing copy, rewrite in builder voice and explain the difference

## Evaluation
- Assess drafts against the evaluation criteria table in the skill body
- Rate hook strength, proof presence, platform adaptation, and tone accuracy
- Suggest specific improvements for the weakest dimension`,
    agents: `# AGENTS.md — X & LinkedIn Social Draft

## Review checklist
- Does the hook earn a click-to-expand? Would you stop scrolling for it?
- Is there a proof artifact (screenshot, metric, link) attached or referenced?
- Does the post sound like a builder sharing real work, not a marketer optimizing engagement?
- For X threads: is each post ≤280 chars and readable in isolation?
- For LinkedIn: are paragraphs short (1–3 sentences) with white space?
- Is the CTA platform-appropriate and specific (not "thoughts?")?
- If posted to both platforms, are the drafts meaningfully different?
- Is the self-promotion ratio ≤1:4 (promotional to value posts)?

## Quality gates
- Reject posts with no proof artifact and no opinion-piece framing
- Reject X posts exceeding 280 characters per tweet
- Reject LinkedIn posts with external links in the body (must go in first comment)
- Reject copy-pasted cross-platform posts without adaptation
- Reject hooks that use anti-patterns: "I'm excited to announce," "Thread 🧵," filler openers

## Anti-patterns to flag
- Marketing voice instead of builder voice
- Threads longer than 10 posts without explicit user request
- Missing line breaks in X posts (walls of text)
- Generic CTAs that could apply to any post
- Hook pattern repetition within the same week
- Engagement bait questions with no genuine intent to discuss
- Humble-brag framing ("I can't believe this happened…")`
  }
};

const audienceGrowth: SeedSkill = {
  slug: "audience-growth",
  title: "YouTube & X Audience Growth",
  category: "social",
  accent: "signal-gold",
  tags: ["growth", "engagement", "followers", "analytics", "social"],
  description:
    "Follower growth mechanics on YouTube and X, engagement optimization, reply strategies, collaboration tactics, and analytics-driven content iteration.",
  body: `# YouTube & X Audience Growth

Follower growth mechanics for YouTube and X. Engagement optimization, reply strategies, collaboration tactics, and analytics-driven content iteration that compounds over time.

## When to use

- You want to grow your audience on YouTube or X from zero or from a plateau
- You need to understand platform-specific growth mechanics and algorithms
- You want a systematic approach to engagement, not random posting
- You are analyzing analytics to decide what content to double down on
- You need collaboration and cross-promotion tactics

## When NOT to use

- You need help with content strategy or pillar planning — use social-content-os
- You want to draft individual posts — use social-draft
- You are focused on Instagram, TikTok, or LinkedIn growth specifically
- You want to buy followers or use engagement pods — this is organic growth only
- You need paid ad strategy — this skill covers organic mechanics only

## Core concepts

### Growth loops

Growth is not linear — it is a series of compounding loops:

\\\`\\\`\\\`
Create content → Earn impressions → Convert to engagement → Gain followers
     ↑                                                            |
     └────────────── Followers see next content ──────────────────┘
\\\`\\\`\\\`

Each step has a conversion rate. Improving any one rate accelerates the entire loop.

### Platform algorithm mechanics

**X algorithm signals (ranked by weight):**

| Signal | Weight | How to optimize |
|--------|--------|-----------------|
| Reply + engagement within 60 min | Very high | Post when your audience is online, engage immediately |
| Bookmark rate | High | Write reference-worthy content (lists, frameworks, how-tos) |
| Quote tweet rate | High | Write takes worth responding to, not just agreeing with |
| Like-to-impression ratio | Medium | Strong hooks increase this ratio |
| Profile visit rate | Medium | Compelling bio + pinned post that converts visitors |
| Follower-to-following ratio | Low | Signals authority, but do not obsess over it |

**YouTube algorithm signals (ranked by weight):**

| Signal | Weight | How to optimize |
|--------|--------|-----------------|
| Click-through rate (CTR) | Very high | Thumbnail + title are 80% of discovery |
| Average view duration (AVD) | Very high | Hook viewers in first 30 seconds, maintain pace |
| Watch time (total minutes) | High | Longer videos if retention stays above 40% |
| Engagement (likes, comments, shares) | Medium | Ask for engagement at natural story beats, not randomly |
| Upload consistency | Medium | Algorithm rewards predictable publishing schedules |
| Session time (viewer stays on YouTube) | Low-medium | Suggest your own videos as next watch (end screens, cards) |

### Engagement tiers

Not all engagement is equal. Prioritize by conversion power:

| Tier | Action | Value | Strategy |
|------|--------|-------|----------|
| 1 | Thoughtful reply to your post | Highest — signals depth | Reply back within 1 hour, extend the conversation |
| 2 | Bookmark / Save | High — signals reference value | Create save-worthy content (frameworks, checklists) |
| 3 | Share / Retweet / Quote | High — amplification | Write takes that people want to be seen agreeing with |
| 4 | Like | Medium — signal but no amplification | The baseline; optimize for higher tiers |
| 5 | View / Impression | Low — top-of-funnel only | Volume metric; only valuable if conversion rates are healthy |

### Reply strategy

Replies are the highest-leverage growth activity on X:

**Inbound replies (people replying to you):**
- Reply to every thoughtful response within the first hour
- Ask a follow-up question to extend the thread — multi-reply threads boost post visibility
- Pin the best reply conversation to the top

**Outbound replies (you replying to others):**
- Reply to 5–10 accounts in your niche daily with genuine, substantive takes
- Do not reply with "Great post!" — add a new angle, a counter-example, or a personal experience
- Target accounts 2–5x your follower count — their audience becomes your discovery channel
- Reply to trending topics only if you have genuine expertise to add

### Collaboration tactics

| Tactic | X implementation | YouTube implementation |
|--------|-----------------|----------------------|
| Co-creation | Write a thread together (alternating posts) | Guest appearances, collab videos |
| Signal boost | Quote-tweet with substantive addition | Feature in community posts, mention in videos |
| Audience swap | Mutual shout-out with specific recommendation | End screen cross-promotion |
| Challenge/series | Start a public challenge others join | Collab series or response videos |

### Analytics-driven iteration

**Weekly metrics to track:**

\\\`\\\`\\\`
X:
  Impressions (total + per-post average)
  Engagement rate (engagements / impressions)
  Profile visits
  Follower delta
  Top post (by engagement rate, not raw impressions)
  Reply response rate (% of inbound replies you responded to)

YouTube:
  Views (total + per-video average)
  CTR (click-through rate from impressions)
  AVD (average view duration as % of video length)
  Subscriber delta
  Top video (by CTR × AVD, not raw views)
  Session start rate (% of views that started a YouTube session)
\\\`\\\`\\\`

**Monthly content audit:**

1. Sort all posts/videos by engagement rate descending
2. Identify the top 20% — what do they have in common? (topic, format, hook style, time posted)
3. Identify the bottom 20% — what went wrong? (weak hook, wrong timing, no proof, off-pillar)
4. Double down on top patterns, sunset bottom patterns
5. Test one new format or topic per month to avoid stagnation

## Workflow

### Step 1 — Audit current state

Record baseline metrics: follower count, average engagement rate, posting frequency, top 3 posts/videos by engagement.

### Step 2 — Identify growth bottleneck

Use the growth loop to find the weakest link:
- Low impressions → discovery problem (algorithm, hashtags, collaborations)
- Low engagement rate → content quality or audience mismatch
- Low follower conversion → weak profile, bio, or pinned content

### Step 3 — Set 30-day targets

Example: "Grow X followers from 2,000 to 2,500 by increasing engagement rate from 2% to 3.5% through reply strategy and bookmark-optimized content."

### Step 4 — Execute daily cadence

| Activity | Time | Platform |
|----------|------|----------|
| Publish content | AM | X / YouTube |
| Engage inbound replies | First 60 min after post | X |
| Outbound reply strategy | 15 min | X |
| Community post / poll | Midday | YouTube |
| Analytics check | Evening | Both |

### Step 5 — Weekly review

Compare metrics to 30-day targets. Adjust tactics if off-track.

## Examples

### Example growth bottleneck diagnosis

\\\`\\\`\\\`
Current state:
  X followers: 1,200
  Impressions/week: 50,000
  Engagement rate: 1.8%
  Follower delta/week: +15

Diagnosis:
  Impressions are healthy for this follower count (41x multiplier).
  Engagement rate is below target (want >2.5%).
  Follower conversion is low — 15/50,000 = 0.03%.

Bottleneck: Content is getting seen but not engaging.

Actions:
  1. Rewrite hooks using the metric-lead and contrarian-claim patterns
  2. Add proof artifacts to every post (screenshots, code)
  3. Implement reply strategy — respond to all inbound within 60 min
  4. Target: 2.5% engagement rate within 3 weeks
\\\`\\\`\\\`

### Example YouTube CTR optimization

\\\`\\\`\\\`
Video: "How I Built an AI Agent in 30 Minutes"
Current CTR: 4.2% (below 5% target)
Current AVD: 62% (strong)

Diagnosis: People who click watch the whole video, but not enough people click.

Thumbnail test plan:
  A: Current thumbnail (code editor screenshot)
  B: Before/after split screen (messy code → clean agent)
  C: Face + shocked expression + "30 MIN?" text overlay

Title test plan:
  A: "How I Built an AI Agent in 30 Minutes" (current)
  B: "I Built a Production AI Agent in 30 Minutes — Here's How"
  C: "The 30-Minute AI Agent That Replaced My Intern"

Target: 6% CTR within 2 weeks of thumbnail/title update
\\\`\\\`\\\`

## Decision tree

1. **What is my current growth rate?** Flat → audit for bottleneck. Growing → optimize the weakest metric.
2. **Is the bottleneck discovery, engagement, or conversion?** Diagnose using the growth loop.
3. **Am I on X, YouTube, or both?** Apply platform-specific algorithm tactics.
4. **Am I engaging enough?** <5 outbound replies/day on X → increase outreach. <2 community posts/week on YouTube → increase.
5. **Am I tracking metrics weekly?** No → start now. Yes → identify the 30-day target delta.
6. **Is growth plateauing?** Yes → test a new format, collaborate, or audit for content stagnation.

## Edge cases and gotchas

- **Impression inflation** — a single viral post can inflate weekly impressions 10x, making the following week look like a crash. Use 4-week rolling averages.
- **Follower-count vanity** — 10,000 disengaged followers are worth less than 1,000 active ones. Track engagement rate, not just follower count.
- **Reply farming** — do not reply "Great post!" to 50 accounts. The algorithm detects low-quality engagement and can suppress your account.
- **YouTube CTR decay** — CTR naturally drops as a video is shown to broader audiences. Compare CTR at the same impression count, not the same time.
- **Engagement pods** — artificial engagement groups produce hollow metrics and can trigger platform penalties. Build real engagement.
- **Consistency gaps** — missing one week of posting is fine. Missing three weeks resets algorithmic momentum significantly.
- **Collaboration mismatch** — collaborating with accounts 100x your size rarely helps. Target 2–5x for reciprocal value.
- **Analytics paralysis** — check metrics weekly, not daily. Daily fluctuations are noise, not signal.
- **Subscriber ≠ viewer on YouTube** — subscriber notification rates are ~10%. Focus on CTR from browse/search, not just subscriber feed.

## Evaluation criteria

| Metric | Poor | Acceptable | Strong |
|--------|------|------------|--------|
| X follower growth (weekly) | <0.5% | 1–3% | >5% |
| X engagement rate | <1.5% | 2.5–4% | >5% |
| YouTube CTR | <3% | 5–8% | >10% |
| YouTube AVD (% of video) | <30% | 40–60% | >65% |
| Reply response rate | <20% | 50–75% | >90% |
| Outbound replies/day (X) | 0–1 | 3–5 | 8–12 |
| Content audit frequency | Never | Quarterly | Monthly |
| Collaboration rate | 0/month | 1–2/month | 3+/month |`,
  agentDocs: {
    codex: `# Codex — YouTube & X Audience Growth

## Purpose
Guide the agent to diagnose growth bottlenecks and recommend platform-specific tactics.

## Behavior rules
- When the user asks to "grow my audience" or "get more followers," activate this skill
- Always start by asking for current metrics: follower count, engagement rate, posting frequency
- Diagnose the growth bottleneck using the growth loop model before recommending tactics
- Recommend platform-specific optimizations, not generic "post more" advice
- Generate 30-day growth targets with specific numeric goals
- When analyzing analytics, compute the weakest conversion rate in the growth loop
- Suggest reply strategy as the highest-leverage activity for X growth
- For YouTube, always assess CTR and AVD together — high AVD with low CTR means a thumbnail/title problem
- Recommend collaboration targets at 2–5x the user's follower count
- Warn against engagement pods, reply farming, and follower-count vanity

## Output format
- Growth diagnosis: current state → bottleneck → specific actions
- Weekly targets: metric name, current value, target value, tactic to get there
- Content audit: sorted table with engagement rates and pattern analysis
- Collaboration plan: target accounts with rationale for each

## Constraints
- Do not fabricate analytics data or project unrealistic growth rates
- Do not recommend paid promotion — organic only
- Do not suggest engagement pods or artificial engagement tactics
- Maximum projection horizon: 90 days (beyond that is speculation)`,
    cursor: `# Cursor — YouTube & X Audience Growth

## When to activate
- User opens analytics files or growth planning documents
- User asks about follower growth, engagement optimization, or algorithm tactics
- User references YouTube CTR, AVD, or X engagement metrics

## Inline behavior
- Autocomplete growth diagnosis templates when the user enters current metrics
- Suggest bottleneck identification when metrics are pasted
- Lint growth plans for: missing baseline metrics, unrealistic targets, no reply strategy
- Offer algorithm-specific suggestions when the user mentions a platform

## Code generation
- Generate markdown templates for weekly analytics tracking
- Create growth bottleneck diagnosis worksheets
- Produce collaboration outreach templates
- Generate A/B test plans for YouTube thumbnails and titles

## Completions
- When entering metrics, suggest benchmark comparisons (e.g., "2% engagement is below the 2.5% target")
- Suggest reply strategy cadence when the user mentions engagement
- Autocomplete collaboration tactic templates

## Diagnostics
- Flag growth plans with no baseline metrics
- Warn when follower growth targets exceed 10%/week (unrealistic for organic)
- Detect analytics data that suggests a viral spike (not sustainable growth)
- Highlight when reply response rate is below 50%
- Flag YouTube videos with high AVD but low CTR as thumbnail/title problems`,
    claude: `# Claude — YouTube & X Audience Growth

## Role
Act as a growth strategist who diagnoses bottlenecks and recommends platform-specific, data-driven tactics.

## Conversation patterns
- When asked about growth, always start by requesting current metrics before giving advice
- Diagnose the growth bottleneck before recommending tactics — never lead with "post more"
- Explain algorithm mechanics when relevant, but focus on actionable tactics the user can implement today
- When reviewing analytics, identify the single highest-leverage improvement

## Generation rules
- Growth diagnoses must follow the format: current state → bottleneck → actions → target
- Always specify which platform each tactic applies to — X and YouTube have different levers
- When recommending reply strategy, provide specific outreach targets (e.g., "5 substantive replies to accounts with 5–15K followers")
- For YouTube recommendations, always consider CTR and AVD together
- Include specific 30-day numeric targets, not vague "improve engagement"
- When suggesting collaborations, specify the ideal follower-count ratio (2–5x)

## Guardrails
- Never recommend buying followers, engagement pods, or artificial engagement
- Do not project growth beyond 90 days — too many variables
- Do not promise specific follower counts — only conversion rate improvements
- When the user's metrics show a viral spike, frame it as an anomaly and focus on sustainable baseline growth
- If the user is posting <2x/week, address consistency before any other tactic
- Refuse to recommend growth tactics that sacrifice content quality

## Evaluation
- Assess the user's growth against the evaluation criteria table
- Identify the weakest metric and suggest one specific, high-leverage improvement
- Frame feedback as "your strongest metric is X, your biggest opportunity is Y"`,
    agents: `# AGENTS.md — YouTube & X Audience Growth

## Review checklist
- Is the growth diagnosis grounded in actual metrics, not assumptions?
- Does the plan identify a specific bottleneck in the growth loop?
- Are the recommended tactics platform-specific (not generic "post more")?
- Are 30-day targets numeric and realistic (not "grow a lot")?
- Is the reply strategy included with specific daily targets?
- For YouTube: are CTR and AVD both assessed together?
- Is the collaboration strategy targeting appropriate-size accounts (2–5x)?
- Are metrics tracked weekly with rolling averages, not daily spot checks?

## Quality gates
- Reject growth plans with no baseline metrics
- Reject targets that assume >10% weekly follower growth (unrealistic organic)
- Flag advice that applies to the wrong platform (e.g., LinkedIn tactics for X)
- Require a reply strategy for any X growth plan
- Require CTR + AVD analysis for any YouTube growth plan

## Anti-patterns to flag
- Engagement pod recommendations
- "Just post more" without addressing content quality or bottleneck
- Follower-count obsession without engagement rate tracking
- Daily analytics checking (leads to reactive, not strategic, decisions)
- Collaboration with accounts >20x the user's size (asymmetric value)
- Ignoring consistency in favor of viral-chasing
- YouTube advice that focuses on views without CTR and AVD context`
  }
};

const contentRepurposing: SeedSkill = {
  slug: "content-repurposing",
  title: "Content Repurposing",
  category: "social",
  accent: "signal-gold",
  tags: ["repurposing", "multi-format", "distribution", "content"],
  description:
    "Multi-format content adaptation: turning one idea into blog posts, social threads, newsletter segments, video scripts, and documentation.",
  body: `# Content Repurposing

Multi-format content adaptation system. Turn one core idea into blog posts, social threads, newsletter segments, video scripts, and documentation — without copy-pasting.

## When to use

- You have created a piece of content and want to extract maximum value from it
- You need to distribute one idea across multiple platforms and formats
- You want to reduce creative overhead by repurposing instead of creating from scratch
- You are building a content flywheel where every piece feeds the next
- You need to adapt technical content for different audience sophistication levels

## When NOT to use

- You are creating a first draft from scratch — use the platform-specific drafting skill
- The content is so time-sensitive that adaptation would make it stale
- You are copy-pasting the same text to multiple platforms — that is not repurposing, that is spamming
- The original content is low-quality — repurposing amplifies quality problems

## Core concepts

### The content atom

Every piece of content has a "content atom" — the single core insight, framework, or story that makes it valuable. Repurposing starts by extracting the atom, not by reformatting the surface.

**Example content atom:**
\\\`\\\`\\\`
Atom: "Replacing 400 lines of custom RAG with 50 lines of native SDK calls
       reduced latency 12x and improved accuracy."
\\\`\\\`\\\`

This atom can become: an X thread, a LinkedIn post, a blog post, a newsletter segment, a conference talk, a YouTube video, a documentation example, and a podcast talking point.

### The adaptation matrix

Each format has different constraints and affordances:

| Format | Length | Depth | Audience | Proof style | Shelf life |
|--------|--------|-------|----------|-------------|------------|
| X thread | 3–10 posts | Medium | Tech-savvy | Screenshots, code | 24–48 hours |
| X single post | 280 chars | Shallow | Broad tech | One metric or quote | 12–24 hours |
| LinkedIn post | 300–1300 words | Medium-deep | Professional | Narrative, metrics | 3–7 days |
| Blog post | 800–2500 words | Deep | Search + direct | Full code, benchmarks | Months–years |
| Newsletter segment | 200–500 words | Medium | Subscribers | Summary + link | 1 week |
| Video script | 5–15 min | Deep | Visual learners | Screen recording, diagrams | Months–years |
| Documentation | Varies | Very deep | Users/developers | Code examples, API refs | Maintained |
| Conference talk | 15–30 min | Deep | Live audience | Slides, live demo | Recorded: years |
| Podcast talking point | 3–5 min segment | Medium | Audio listeners | Verbal storytelling | Months |

### The repurposing waterfall

Content flows downhill from high-effort to low-effort formats:

\\\`\\\`\\\`
Long-form source (blog, talk, video)
  ├── LinkedIn article (extract narrative + key takeaways)
  ├── X thread (compress to 5–7 punchy posts)
  │     └── X single post (extract the single best line)
  ├── Newsletter segment (summarize + add subscriber-only context)
  ├── Documentation example (extract the code + explain for users)
  └── Podcast talking point (adapt the story for verbal delivery)
\\\`\\\`\\\`

**Reverse waterfall (bottom-up):**
Sometimes a short post performs well and warrants expansion:

\\\`\\\`\\\`
Viral X post
  ├── Expand into X thread (add context, proof, steps)
  ├── Expand into blog post (add full code, benchmarks, alternatives)
  ├── Expand into video (screen-record the walkthrough)
  └── Expand into newsletter feature (add subscriber-exclusive insights)
\\\`\\\`\\\`

### Adaptation, not duplication

Repurposing means rewriting for the format, not reformatting the same text:

| Duplication (bad) | Adaptation (good) |
|-------------------|-------------------|
| Copy-paste X thread to LinkedIn | Rewrite as narrative with expanded context |
| Paste blog post intro as newsletter | Write a personalized summary with a "why this matters to you" angle |
| Read blog post verbatim in video | Screen-record the actual process with verbal commentary |
| Embed entire thread in blog post | Expand each thread post into a full paragraph with code examples |

### Content freshness layers

When repurposing, add a freshness layer to each format:

- **New proof:** Updated metrics, additional screenshots, follow-up results
- **New angle:** A different perspective on the same insight for a different audience
- **New depth:** Expand a surface-level point into a full walkthrough
- **New context:** Add background that was assumed in the original format
- **New CTA:** Each format should drive a different action (follow, subscribe, bookmark, star)

## Workflow

### Step 1 — Extract the content atom

From the source content, identify:
- The single core insight (one sentence)
- The proof that supports it (metric, screenshot, code, story)
- The audience who cares (and why)

### Step 2 — Choose target formats

Use the adaptation matrix to select 3–5 formats based on:
- Where your audience is (platform presence)
- What format suits the atom (visual → video; step-by-step → thread; narrative → LinkedIn)
- Effort budget (start with highest-value, lowest-effort adaptations)

### Step 3 — Map the freshness layer

For each target format, identify what new element you will add:

\\\`\\\`\\\`
Source: Blog post about RAG pipeline migration
  → X thread: Add a "1 month later" follow-up metric (new proof)
  → LinkedIn: Add the personal story of why you built it (new angle)
  → Newsletter: Add the mistake you almost made (new depth)
  → Video: Screen-record the actual migration process (new context)
\\\`\\\`\\\`

### Step 4 — Draft in waterfall order

Start from the most constrained format (X single post) and expand:
1. X single post → forces you to find the single best line
2. X thread → expands to 5–7 key points
3. LinkedIn → adds narrative and professional context
4. Newsletter → adds subscriber-exclusive insight
5. Blog → full depth with code, benchmarks, alternatives

### Step 5 — Schedule across time

Do not publish all formats on the same day. Stagger across 5–10 days:

| Day | Format | Rationale |
|-----|--------|-----------|
| Day 1 | Blog post (source) | Canonical, SEO-indexed content |
| Day 2 | X thread | Drives traffic to blog, catches X audience |
| Day 3 | LinkedIn post | Different audience, narrative format |
| Day 5 | Newsletter segment | Subscriber-exclusive framing |
| Day 7 | YouTube video | Visual walkthrough for search longevity |

### Step 6 — Cross-link

Every format should reference at least one other format:
- X thread links to blog post
- Blog post embeds the X thread
- Newsletter links to blog and video
- Video description links to blog and X thread

## Examples

### Example: repurposing a conference talk

\\\`\\\`\\\`
Source: 25-minute conference talk on "Evals for AI Agents"

Content atom: "Most AI teams skip evals because they seem hard,
              but a basic eval suite takes 30 minutes and catches
              80% of production failures."

Repurposing plan:
  1. Blog post (Day 1): Full transcript + code examples for the eval suite
  2. X thread (Day 2): 7-post thread with the key framework + results
  3. LinkedIn (Day 3): "I gave a talk about evals. Here's what the audience
     was most surprised by…" (narrative + vulnerability)
  4. Newsletter (Day 5): "The one slide that got the most questions" +
     subscriber-only eval template download
  5. YouTube (Day 7): Talk recording + screen-recorded eval setup tutorial
  6. Documentation (Day 10): Eval setup guide for the project's docs
\\\`\\\`\\\`

### Example: repurposing a viral X post

\\\`\\\`\\\`
Source: Single X post that got 50K impressions —
        "Hot take: most RAG implementations are over-engineered."

Content atom: Native SDK capabilities have caught up to custom RAG stacks.

Expansion plan:
  1. X thread (Day 1): Expand with proof — before/after code, metrics
  2. Blog post (Day 3): Full technical walkthrough with benchmarks
  3. LinkedIn (Day 4): Narrative version — "I spent 6 months building custom
     infra. Last week I deleted most of it."
  4. Newsletter (Day 6): "Why I deleted my RAG pipeline" + framework for
     evaluating build-vs-buy decisions
  5. Video (Day 8): Screen recording of the actual migration
\\\`\\\`\\\`

## Decision tree

1. **Do I have a content atom worth repurposing?** No → create original content first. Yes → continue.
2. **Is the atom time-sensitive?** Yes → prioritize fastest formats (X post, LinkedIn). No → use the full waterfall.
3. **Which format is the source?** Start from the source and flow outward in the waterfall.
4. **What freshness layer can I add to each format?** New proof, angle, depth, context, or CTA.
5. **Do I have the effort budget for all planned formats?** No → prioritize the 2–3 highest-value formats. Yes → execute the full plan.
6. **Am I duplicating or adapting?** If the text is the same across formats, rewrite. Adaptation means rewriting for each format's constraints.

## Edge cases and gotchas

- **Atom exhaustion** — not every piece of content has a repurposable atom. If you cannot state the atom in one sentence, it may not be worth repurposing.
- **Format forcing** — some atoms do not work in all formats. A highly visual insight does not adapt well to a podcast talking point. Skip formats that do not fit.
- **Audience overlap** — if 80% of your LinkedIn audience also follows you on X, they will notice lazy duplication. The freshness layer is mandatory, not optional.
- **Stale repurposing** — if the source content is 3+ months old, update the data before repurposing. Old metrics undermine credibility.
- **SEO cannibalization** — blog post and documentation should target different keywords to avoid competing with each other in search.
- **Cross-link dead ends** — every cross-link must actually work. Broken links to unpublished content damage trust. Publish in waterfall order.
- **Effort creep** — repurposing 1 atom into 7 formats can take longer than creating 7 original pieces. Cap at 4–5 formats per atom.
- **Platform policy** — some platforms penalize content that links to competitors (e.g., LinkedIn suppresses X links). Use link-in-comment workarounds.
- **Newsletter fatigue** — subscribers joined for original insight, not repackaged social posts. Always add subscriber-exclusive value.

## Evaluation criteria

| Metric | Poor | Acceptable | Strong |
|--------|------|------------|--------|
| Formats per atom | 1 (no repurposing) | 3–4 formats | 5+ formats with freshness layers |
| Adaptation quality | Copy-paste | Minor rewrites | Fully rewritten per format |
| Freshness layers | None | 1 layer per format | Unique proof/angle/depth per format |
| Cross-linking | No links | Some formats linked | All formats cross-linked |
| Time spread | All same day | 3–5 days | 7–10 day stagger |
| Audience-specific framing | Generic | Platform-aware | Audience-specific angle per format |
| Effort efficiency | 1:1 (new content per format) | 1:3 ratio | 1:5+ ratio (atom to formats) |`,
  agentDocs: {
    codex: `# Codex — Content Repurposing

## Purpose
Guide the agent to help users extract maximum value from a single content atom across multiple formats.

## Behavior rules
- When the user asks to "repurpose" or "adapt" content, activate this skill
- Always start by extracting the content atom — the single core insight in one sentence
- Generate an adaptation plan using the waterfall model before drafting any format
- Require a freshness layer for each target format — refuse to produce copy-pasted adaptations
- Map each format to the adaptation matrix constraints (length, depth, audience, proof style)
- Suggest a staggered publishing schedule across 5–10 days
- Include cross-linking recommendations for every format
- When the source is short-form (X post, tweet), use the reverse waterfall (expand upward)
- When the source is long-form (blog, talk), use the standard waterfall (compress downward)
- Flag atom exhaustion — if the core insight cannot be stated in one sentence, it may not be worth repurposing

## Output format
- Content atom extraction: one sentence + proof + audience
- Adaptation plan: table with format, freshness layer, publish date, cross-links
- Draft outlines: per-format structure with key points and proof placement
- Publishing schedule: staggered timeline with rationale

## Constraints
- Do not produce identical text for multiple formats — adaptation is mandatory
- Cap format count at 5 unless the user explicitly wants more
- Do not recommend formats that do not suit the atom (e.g., visual atom → no podcast)
- Always include the freshness layer — "what is new in this version?"`,
    cursor: `# Cursor — Content Repurposing

## When to activate
- User opens a content file and mentions repurposing or multi-format distribution
- User asks to "turn this into a thread" or "adapt this for LinkedIn"
- User is editing content alongside platform-specific draft files

## Inline behavior
- Suggest content atom extraction when the user selects a block of text
- Offer adaptation matrix recommendations when the user creates a new format file
- Lint adaptations for: copy-paste detection, missing freshness layers, broken cross-links
- Warn when adaptations exceed 80% text similarity with the source

## Code generation
- Generate adaptation plan templates with waterfall structure
- Create format-specific outline templates (X thread, LinkedIn, newsletter, blog)
- Produce cross-linking checklists for multi-format publishing
- Generate staggered publishing schedules

## Completions
- When typing in a new format file, suggest the content atom from the source
- Autocomplete freshness layer suggestions based on the format type
- Suggest cross-links to other formats of the same atom

## Diagnostics
- Flag text blocks with >80% similarity to the source (copy-paste detection)
- Warn on missing cross-links between published formats
- Highlight formats with no freshness layer added
- Detect format-atom mismatches (e.g., podcast script for a highly visual atom)
- Flag all-same-day publishing schedules (should be staggered)`,
    claude: `# Claude — Content Repurposing

## Role
Act as a content strategist who helps users extract maximum distribution value from a single core idea.

## Conversation patterns
- When asked to repurpose content, always start by asking "What is the single core insight?"
- Extract the content atom before suggesting any formats
- Present the adaptation matrix and help the user choose 3–5 formats based on their audience and effort budget
- For each format, explain what freshness layer will make it feel new, not recycled

## Generation rules
- Always extract and state the content atom explicitly before generating any adapted content
- Generate adapted content in waterfall order: most constrained format first (X post), then expand
- Each adapted piece must include a freshness layer — new proof, angle, depth, context, or CTA
- Include platform-specific formatting (line breaks for X, white space for LinkedIn, headers for blog)
- Add cross-linking suggestions to every adapted piece
- When expanding (reverse waterfall), ask what additional proof or context the user can provide

## Guardrails
- Refuse to produce identical text for two different formats — this is duplication, not repurposing
- Do not recommend more formats than the user has capacity for (ask about effort budget)
- Flag if the content atom is too weak to sustain multiple formats
- Warn when repurposing content older than 3 months without data updates
- Do not assume the user's audience is the same across platforms — ask about audience differences
- Cap suggestions at 5 formats per atom unless explicitly asked for more

## Evaluation
- Assess each adapted piece against the evaluation criteria table
- Rate adaptation quality: copy-paste / minor rewrite / fully adapted
- Check that cross-links exist and freshness layers are present`,
    agents: `# AGENTS.md — Content Repurposing

## Review checklist
- Is the content atom clearly stated in one sentence?
- Are target formats chosen based on audience fit, not just "all of them"?
- Does each adapted piece have a freshness layer (new proof, angle, depth, context, CTA)?
- Is the adaptation genuine (rewritten for the format) or lazy (copy-pasted)?
- Are formats cross-linked so each piece drives traffic to others?
- Is the publishing schedule staggered across 5–10 days, not all same day?
- Is the effort budget realistic for the number of planned formats?

## Quality gates
- Reject adaptations with >80% text similarity to the source or another format
- Reject format plans with no freshness layer documented
- Flag atoms that cannot be stated in one sentence (too diffuse to repurpose)
- Require cross-links for all published formats
- Reject all-same-day publishing schedules

## Anti-patterns to flag
- Copy-pasting between platforms without adaptation
- Repurposing without a clear content atom
- Publishing all formats on the same day (audience fatigue)
- Missing freshness layers (recycled content feels stale)
- Newsletter segments that are just social post rehashes with no exclusive value
- Cross-links to content that has not been published yet (dead links)
- Forcing an atom into a format that does not suit it (visual atom → podcast)`
  }
};

const newsletterCraft: SeedSkill = {
  slug: "newsletter-craft",
  title: "Substack Newsletter Craft",
  category: "social",
  accent: "signal-gold",
  tags: ["newsletter", "email", "growth", "writing", "distribution"],
  description:
    "Email newsletter writing with Substack and Resend, growth tactics, subject line optimization, audience segmentation, and retention strategies.",
  body: `# Substack Newsletter Craft

Email newsletter writing and growth system for Substack (and Resend for custom sending). Subject line optimization, audience segmentation, retention strategies, and writing craft that keeps subscribers opening.

## When to use

- You are starting or growing an email newsletter on Substack
- You need to improve open rates, click-through rates, or subscriber retention
- You want subject line optimization frameworks and A/B testing tactics
- You need audience segmentation strategies for different subscriber types
- You are integrating newsletter writing with a broader content distribution system
- You want to use Resend for custom email delivery alongside Substack

## When NOT to use

- You are writing social posts — use social-draft
- You need content strategy for social platforms — use social-content-os
- You are building a full email marketing automation system (drip campaigns, e-commerce) — use a dedicated ESP
- You need help with email deliverability at scale (>100K sends) — consult a deliverability specialist

## Core concepts

### The newsletter value contract

Every subscriber made an implicit deal: "I give you my inbox; you give me value I cannot get elsewhere." Every issue must honor that contract. The moment a subscriber questions whether your newsletter is worth their inbox space, unsubscribe is one click away.

### Open rate mechanics

**Subject line is 80% of your open rate.** The preview text (preheader) is another 15%. The remaining 5% is sender reputation and timing.

**Subject line frameworks:**

| Framework | Template | Example | Best for |
|-----------|----------|---------|----------|
| Curiosity gap | "[Topic]: the part nobody talks about" | "AI agents: the part nobody talks about" | Engaged subscribers |
| Specific benefit | "How to [achieve X] in [timeframe]" | "How to set up evals in 30 minutes" | New subscribers |
| Number list | "[N] [things] that [outcome]" | "5 prompt patterns that actually work" | Broad audience |
| Contrarian | "Why [common belief] is wrong" | "Why fine-tuning is wrong for most teams" | Opinionated niche |
| Story hook | "The time I [unexpected event]" | "The time our AI agent insulted a customer" | Personal brand |
| Urgency | "[Breaking/New]: [what happened]" | "New: OpenAI just changed everything about evals" | Time-sensitive |
| Question | "Are you [doing common mistake]?" | "Are you over-engineering your RAG pipeline?" | Problem-aware audience |

**Subject line rules:**
- Keep it under 50 characters (mobile truncation)
- Do not use ALL CAPS or excessive punctuation (spam filters)
- Personalization tokens (e.g., subscriber's first name) increase open rate by 5–10%
- A/B test subject lines on 20% of your list, send the winner to the remaining 80%
- Never use "Newsletter #47" — that is a filing system, not a hook

### Preview text (preheader)

The first ~90 characters of body text that appear below the subject line in most email clients. This is free real estate that most newsletters waste.

**Good preheader patterns:**
- Extend the curiosity gap: Subject "AI agents: the part nobody talks about" → Preview "Hint: it's not the prompts."
- Promise specifics: Subject "5 prompt patterns" → Preview "Including the one that saved us 40% on API costs."
- Contrast: Subject "Why fine-tuning is wrong" → Preview "RAG + evals beats it in 90% of use cases. Here's the data."

### Newsletter structure

**The reliable newsletter anatomy:**

\\\`\\\`\\\`
1. Hook (2–3 sentences)
   → Why should the reader care about this issue? What is at stake?

2. Main insight (300–800 words)
   → The core value: framework, story, analysis, or tutorial
   → Include proof: data, screenshots, code, personal experience

3. Takeaway (2–3 sentences)
   → The one thing the reader should remember or do

4. Bonus section (optional, 100–200 words)
   → Curated links, tools, or a secondary insight

5. CTA (1 sentence)
   → Reply, share, click, or act on the takeaway

6. Footer
   → Social links, archive link, referral prompt
\\\`\\\`\\\`

### Audience segmentation

Not all subscribers want the same thing. Segment by behavior, not demographics:

| Segment | Definition | Strategy |
|---------|-----------|----------|
| Power readers | Open >80% of issues, click links, reply | Give them early access, exclusive content, ask for feedback |
| Regular readers | Open 40–80%, occasional clicks | The core audience — optimize the main newsletter for them |
| Passive readers | Open 10–40%, rarely click | Re-engagement campaigns, shorter issues, survey their interests |
| Ghost subscribers | Open <10% over 3 months | Win-back email, then clean the list if no response |

### Growth tactics

**Organic growth levers:**

| Lever | Effort | Impact | Example |
|-------|--------|--------|---------|
| Social cross-promotion | Low | Medium | Link to newsletter in X bio, mention in threads |
| Content teaser | Low | Medium | Post the hook paragraph on social, link to full issue |
| Referral program | Medium | High | "Share with 3 friends, get the bonus template" |
| Guest swaps | Medium | High | Write for another newsletter, they write for yours |
| Gated content | Medium | Medium | Free PDF/template available only to subscribers |
| Conference mentions | Low | Low-medium | "I wrote about this in my newsletter" in talks |
| SEO (Substack native) | Low | Long-term | Substack posts are indexed — use searchable titles |
| Recommendation network | Low | Medium | Enable Substack recommendations with aligned newsletters |

### Retention strategies

**Reduce churn by:**
- Sending consistently (same day, same time, every week)
- Honoring the value contract (never send filler)
- Cleaning the list quarterly (remove ghosts, improve deliverability)
- Asking for replies (replies signal "not spam" to email clients)
- Providing subscriber-exclusive value (not just repackaged social content)
- Running a "why did you unsubscribe" exit survey

### Resend integration

For custom email delivery (transactional, event-triggered, or styled beyond Substack):

\\\`\\\`\\\`typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'newsletter@yourdomain.com',
  to: subscriber.email,
  subject: 'Your weekly digest',
  react: <WeeklyDigestEmail data={digestData} />,
});
\\\`\\\`\\\`

Use Resend for: welcome sequences, re-engagement emails, transactional notifications, and custom-designed emails. Use Substack for: the main newsletter, discovery, and the recommendation network.

## Workflow

### Step 1 — Define the value contract

Write one sentence: "Subscribers get [specific value] delivered [cadence]."

Example: "Subscribers get one actionable AI engineering insight with code examples, delivered every Wednesday."

### Step 2 — Build the subject line library

Create 20+ subject line templates using the frameworks above. Score each by: curiosity, specificity, and audience fit.

### Step 3 — Draft the issue

Follow the newsletter anatomy: Hook → Main insight → Takeaway → Bonus → CTA → Footer.

### Step 4 — Write the subject line and preheader

Draft 3 subject line options. Pick the one with the strongest curiosity-to-specificity ratio. Write a preheader that extends, not repeats, the subject line.

### Step 5 — A/B test

Send variant A to 10% of the list, variant B to another 10%. Wait 2 hours. Send the winner to the remaining 80%.

### Step 6 — Analyze and iterate

After each issue, record: open rate, click rate, reply count, unsubscribe count, and top-clicked link.

## Examples

### Example subject line A/B test

\\\`\\\`\\\`
Issue topic: How to set up AI agent evals

Variant A: "How to set up evals in 30 minutes"
  → Framework: Specific benefit
  → Strengths: Clear value, specific timeframe
  → Risk: Sounds like a tutorial (may not stand out)

Variant B: "Most AI teams skip evals. Here's why that's expensive."
  → Framework: Contrarian + consequence
  → Strengths: Creates tension, implies cost of inaction
  → Risk: Negative framing may not appeal to everyone

Test: Send A to 10%, B to 10%. Winner to 80%.
Result: B won (42% open rate vs. 35%). Contrarian framing outperformed.
\\\`\\\`\\\`

### Example re-engagement email

\\\`\\\`\\\`
Subject: "Still interested? (Honest question)"
Preview: "I noticed you haven't opened in a while. No hard feelings either way."

Body:
Hey [First Name],

I noticed you haven't opened the newsletter in a few months.

No guilt trip — inboxes are overwhelming,
and I only want to be in yours if I'm earning the space.

Quick question: what would make this newsletter worth opening again?

→ More code examples
→ Shorter issues
→ Different topics (reply and tell me)
→ Honestly, I'd rather unsubscribe (no hard feelings — link below)

Either way, thanks for being here.

[Unsubscribe link]
\\\`\\\`\\\`

### Example weekly metrics log

\\\`\\\`\\\`
Issue #23: "Why I Deleted My RAG Pipeline"
  Sent: 3,200 subscribers
  Open rate: 47% (target: 40%+)
  Click rate: 12% (target: 8%+)
  Replies: 14
  Unsubscribes: 3 (0.09%)
  Top clicked link: GitHub repo link (38% of clicks)
  
  Analysis:
    - Contrarian subject line drove above-average opens
    - Code repo link was the primary CTA driver
    - Reply count suggests strong engagement with the topic
    - Unsubscribe rate well below 0.5% threshold
  
  Action:
    - Create a follow-up issue expanding on the migration process
    - Test a "curiosity gap" subject line next week for comparison
\\\`\\\`\\\`

## Decision tree

1. **Do I have a clear value contract?** No → Step 1. Yes → continue.
2. **Am I sending consistently?** No → set a cadence and stick to it for 4 weeks before optimizing anything else.
3. **Is my open rate below 30%?** Yes → focus on subject lines and preheaders. No → continue.
4. **Is my click rate below 5%?** Yes → improve CTAs and the main insight section. No → continue.
5. **Am I growing subscribers?** No → implement 2–3 growth levers from the growth tactics table. Yes → continue.
6. **Is churn above 1% per issue?** Yes → run re-engagement campaign and exit survey. No → continue.
7. **Am I segmenting my audience?** No → start with the 4-segment model. Yes → optimize content per segment.

## Edge cases and gotchas

- **Open rate inflation** — Apple Mail Privacy Protection pre-loads images, inflating open rates by 10–20%. Track click rate as a more reliable engagement metric.
- **Substack discovery tax** — Substack's recommendation network drives growth but also attracts low-intent subscribers. Segment and clean aggressively.
- **List hygiene** — email providers penalize senders with high bounce rates. Remove invalid emails monthly and ghost subscribers quarterly.
- **Reply-to engagement** — asking for replies boosts deliverability (signals "real person" to spam filters), but you must actually reply back.
- **Unsubscribe friction** — never make unsubscribing hard. A clean list with engaged subscribers outperforms a bloated list every time.
- **Weekday vs. weekend** — B2B newsletters perform best Tue–Thu morning. B2C can work weekends. Test your specific audience.
- **Subject line fatigue** — if you use the same framework every week, open rates decline. Rotate through 3–4 frameworks.
- **Preview text gotcha** — if you do not set a preheader explicitly, email clients pull the first body text, which might be "View in browser" or navigation links.
- **Resend + Substack overlap** — if using both, ensure subscribers do not receive duplicate content. Use Resend for transactional/event-triggered only.
- **Paywall timing** — Substack paid subscriptions work best after 20+ free issues with consistent quality. Do not gate content before you have proven the value.

## Evaluation criteria

| Metric | Poor | Acceptable | Strong |
|--------|------|------------|--------|
| Open rate | <25% | 35–45% | >50% |
| Click rate | <3% | 5–10% | >12% |
| Reply rate (per issue) | 0 replies | 3–10 replies | >15 replies |
| Unsubscribe rate (per issue) | >1% | 0.3–0.5% | <0.2% |
| Subscriber growth (monthly) | Flat | 5–10% | >15% |
| Consistency | Irregular | Weekly | Weekly + bonus issues |
| Subject line A/B testing | Never | Monthly | Every issue |
| List hygiene | Never cleaned | Annually | Quarterly |
| Segmentation | None | 2 segments | 4+ behavioral segments |`,
  agentDocs: {
    codex: `# Codex — Substack Newsletter Craft

## Purpose
Guide the agent to help users write, optimize, and grow email newsletters on Substack.

## Behavior rules
- When the user asks to "write a newsletter" or "improve my open rate," activate this skill
- Always start by asking for the value contract: "What specific value do subscribers get, and how often?"
- Generate 3 subject line variants using different frameworks for every issue
- Require a preheader that extends (not repeats) the subject line
- Draft newsletter content using the standard anatomy: Hook → Insight → Takeaway → Bonus → CTA
- When analyzing performance, focus on open rate, click rate, and reply count — not vanity metrics
- Suggest A/B testing for subject lines with specific split ratios (20% test, 80% winner)
- Recommend list hygiene quarterly and flag ghost subscribers
- When the user mentions Resend, provide integration code examples
- Flag issues that are pure social content repackaging — newsletters need subscriber-exclusive value

## Output format
- Subject line options: 3 variants with framework label and strength/risk analysis
- Newsletter drafts: structured with the 6-part anatomy
- Performance reviews: metrics table + analysis + action items
- Growth plans: prioritized lever list with effort/impact ratings

## Constraints
- Do not fabricate open rates or subscriber counts
- Do not recommend buying email lists or using scraping tools
- Do not suggest making unsubscribe difficult
- Maximum A/B test variants: 2 (more splits need larger lists for statistical significance)
- Always recommend GDPR/CAN-SPAM compliance for subscriber acquisition`,
    cursor: `# Cursor — Substack Newsletter Craft

## When to activate
- User is editing newsletter draft files or Substack content
- User asks about subject lines, open rates, or email optimization
- User references Resend, email sending, or newsletter growth

## Inline behavior
- Autocomplete subject line frameworks when the user starts typing a subject
- Suggest preheader text when a subject line is finalized
- Lint newsletter drafts for: missing hook, no CTA, >1500 words without section breaks
- Warn when draft body starts with navigation text that would become the preheader
- Offer A/B test suggestions when a subject line is written

## Code generation
- Generate newsletter anatomy templates in markdown
- Create subject line libraries with framework labels
- Produce Resend integration code for custom email delivery
- Generate weekly metrics tracking templates
- Create re-engagement email templates

## Completions
- When typing a subject line, suggest alternative frameworks
- Autocomplete the newsletter anatomy structure
- Suggest CTAs based on the newsletter's main topic
- Recommend send times based on audience type (B2B: Tue–Thu, B2C: flexible)

## Diagnostics
- Flag subject lines over 50 characters (mobile truncation)
- Warn on ALL CAPS or excessive punctuation in subject lines
- Detect when newsletter body exceeds 1500 words without clear section breaks
- Flag newsletters with no explicit CTA
- Highlight preview text that would show "View in browser" or navigation instead of content
- Warn when the same subject line framework has been used 3+ times consecutively`,
    claude: `# Claude — Substack Newsletter Craft

## Role
Act as a newsletter strategist and editor who helps the user write compelling issues and grow their subscriber base.

## Conversation patterns
- When asked about newsletters, start by establishing the value contract: what specific value, what cadence
- Always generate multiple subject line options — never just one
- When reviewing draft issues, evaluate against the newsletter anatomy and suggest structural improvements
- When analyzing performance, interpret metrics in context (e.g., Apple Mail inflation affects open rates)

## Generation rules
- Generate 3 subject line variants using different frameworks, with strength/risk analysis for each
- Write preheaders that extend the subject line's curiosity gap, never repeat it
- Draft newsletter content following the 6-part anatomy strictly
- Include proof artifacts in the main insight section (data, screenshots, code, personal experience)
- Write CTAs that are specific to the issue's content, not generic "share this newsletter"
- For re-engagement emails, use honest, non-manipulative tone
- When suggesting growth tactics, prioritize by effort/impact ratio

## Guardrails
- Never recommend buying email lists, scraping emails, or making unsubscribe difficult
- Do not inflate projected growth rates — newsletter growth is typically 5–15%/month organic
- Flag when open rates seem high (>60%) — likely Apple Mail Privacy Protection inflation
- Recommend click rate as the primary engagement metric, not open rate
- Do not suggest paywall before the user has 20+ consistent free issues
- When the user's content overlaps heavily with their social posts, push for subscriber-exclusive value
- Always recommend GDPR/CAN-SPAM compliance

## Evaluation
- Assess each issue against the evaluation criteria table
- Rate subject line, structure, proof presence, CTA quality, and subscriber-exclusive value
- Suggest the single highest-leverage improvement for the next issue`,
    agents: `# AGENTS.md — Substack Newsletter Craft

## Review checklist
- Is the value contract clear? (What value, what cadence)
- Does the subject line use a proven framework and stay under 50 characters?
- Does the preheader extend (not repeat) the subject line?
- Does the issue follow the newsletter anatomy? (Hook → Insight → Takeaway → Bonus → CTA)
- Is there a proof artifact in the main insight section?
- Is the CTA specific to this issue's content?
- Is there subscriber-exclusive value (not just repackaged social content)?
- Is A/B testing being used for subject lines?
- Is list hygiene happening at least quarterly?

## Quality gates
- Reject subject lines over 50 characters without justification
- Reject issues with no CTA
- Reject newsletters that are copy-pasted social content with no exclusive value
- Flag open rates reported without accounting for Apple Mail Privacy Protection
- Require preheader text for every issue (do not let it default to "View in browser")
- Reject ALL CAPS subject lines

## Anti-patterns to flag
- "Newsletter #47" subject lines (filing systems, not hooks)
- Same subject line framework used 3+ weeks in a row
- No A/B testing on subject lines
- Ghost subscribers kept on list for >3 months without re-engagement attempt
- Unsubscribe process that requires more than one click
- Newsletter issues that exceed 2000 words without section breaks or visual relief
- Preview text showing navigation or boilerplate instead of content
- Paid tier launched before 20 free issues with consistent quality`
  }
};

export const social: SeedSkill[] = [
  socialContentOs,
  socialDraft,
  audienceGrowth,
  contentRepurposing,
  newsletterCraft,
];
