import type { CreateSkillInput } from "@/lib/db/skills";

type SeedSkill = Omit<CreateSkillInput, "origin"> & {
  origin?: CreateSkillInput["origin"];
};

export const seoGeo: SeedSkill[] = [
  // -------------------------------------------------------------------------
  // 1. Google SEO & GEO
  // -------------------------------------------------------------------------
  {
    slug: "seo-geo",
    title: "Google SEO & GEO",
    description:
      "On-page SEO for Google and generative-engine optimization for keyword placement, entity coverage, schema markup, AI citability, and crawler readiness.",
    category: "seo-geo",
    accent: "signal-blue",
    featured: true,
    visibility: "public",
    tags: ["featured", "citability", "schema", "keywords", "entities"],
    body: `# Google SEO & GEO

On-page SEO and generative-engine optimization in a single workflow.
This skill covers keyword placement, entity coverage, schema markup,
AI citability signals, and crawler readiness for both classic Google
ranking and next-gen AI search surfaces (ChatGPT, Perplexity, Gemini).

## When to use

- Building or auditing any page that must rank in Google organic results
- Optimizing content for AI search engines (ChatGPT Browse, Perplexity, Gemini)
- Adding or revising \`generateMetadata\` in a Next.js App Router page
- Performing an entity-gap analysis between your content and top-ranking competitors
- Implementing JSON-LD schema for rich snippets or knowledge panels
- Setting up \`llms.txt\` or \`llms-full.txt\` for AI crawlers

## When NOT to use

- Pure paid-search (Google Ads) campaigns — use SEM-specific tooling instead
- Social-only content that will never be indexed (Instagram stories, ephemeral posts)
- Internal documentation not exposed to search crawlers
- When the page is \`noindex\` by design — focus on UX instead

## Core concepts

| Concept | Description |
|---------|-------------|
| Entity coverage | Named entities (people, products, concepts) that Google's NLP expects for a topic |
| Keyword placement zones | Title, H1, first 100 words, subheadings, meta description, URL slug, image alt |
| E-E-A-T signals | Experience, Expertise, Authoritativeness, Trustworthiness — Google's quality rater framework |
| GEO (Generative Engine Optimization) | Structuring content so AI models can extract, cite, and attribute it |
| AI citability | The likelihood that an AI search engine will quote your content with attribution |
| llms.txt | A machine-readable file at the site root that tells AI crawlers what content to index |
| Factual density | Ratio of verifiable claims, statistics, and named entities per paragraph |

## Workflow

### Step 1: Keyword mapping

Map each target page to a primary keyword, 2-3 secondary keywords, and a
user-intent bucket (informational, navigational, transactional, commercial).

### Step 2: Implement generateMetadata in Next.js

\`\`\`typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import { getPost } from "@/lib/posts";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: \`\${post.title} | YourBrand\`,
    description: post.excerpt.slice(0, 155),
    alternates: { canonical: \`https://yourbrand.com/blog/\${slug}\` },
    openGraph: {
      title: post.title,
      description: post.excerpt.slice(0, 155),
      url: \`https://yourbrand.com/blog/\${slug}\`,
      type: "article",
      images: [{ url: post.ogImage, width: 1200, height: 630 }],
    },
  };
}
\`\`\`

### Step 3: Entity gap analysis

1. Collect the top 10 SERP results for your primary keyword.
2. Extract named entities from each using an NLP tool or manual review.
3. Build a union set of entities and mark which ones your content covers.
4. Fill gaps with factual, sourced statements that naturally include missing entities.

### Step 4: JSON-LD structured data

Add \`application/ld+json\` script tags for the relevant schema type.
See the **schema-markup** skill for full implementation patterns.

\`\`\`typescript
// components/article-jsonld.tsx
export function ArticleJsonLd({ post }: { post: Post }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    author: { "@type": "Person", name: post.author },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: post.ogImage,
    publisher: {
      "@type": "Organization",
      name: "YourBrand",
      logo: { "@type": "ImageObject", url: "https://yourbrand.com/logo.png" },
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
\`\`\`

### Step 5: Set up llms.txt

Create \`public/llms.txt\` listing pages AI crawlers should prioritize:

\`\`\`text
# YourBrand llms.txt
# See https://llmstxt.org for spec

> YourBrand builds developer tools for X.

## Docs
- [Getting Started](https://yourbrand.com/docs/start)
- [API Reference](https://yourbrand.com/docs/api)

## Blog
- [How We Built X](https://yourbrand.com/blog/how-we-built-x)
\`\`\`

For a verbose version, also ship \`public/llms-full.txt\` with inline content.

### Step 6: Platform-specific GEO signals

| Platform | Key signal | Action |
|----------|-----------|--------|
| ChatGPT Browse | Factual density, direct answers | Lead sections with a bolded one-sentence answer |
| Perplexity | Source diversity, citations | Include inline citations and link to primary sources |
| Gemini | Schema markup, entity coverage | Maximize JSON-LD and entity density |
| Bing AI | OpenGraph, structured data | Ensure complete OG tags and FAQ schema |

## Examples

### Example 1: Blog post metadata in Next.js App Router

\`\`\`typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post.title,
    description: post.excerpt.slice(0, 155),
    alternates: { canonical: \`https://example.com/blog/\${slug}\` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}
\`\`\`

### Example 2: Entity density improvement

Before: "Our tool helps with SEO."
After: "Our tool analyzes Google Search Console data, identifies keyword cannibalization, and generates schema markup compliant with Schema.org Article and FAQ types."

## Decision tree

- Page needs to rank in Google → apply full keyword placement workflow
- Page targets AI search only → focus on entity density + llms.txt + direct answers
- Page targets both → apply both workflows; JSON-LD and llms.txt are complementary
- Page is behind auth → skip SEO; focus on UX and internal search
- Content is thin (< 300 words) → expand with entity-rich paragraphs before optimizing

## Edge cases and gotchas

1. **Keyword stuffing penalties** — Google penalizes unnatural repetition. Keep primary keyword density between 1-2%. Use semantic variants instead of exact repeats.
2. **Duplicate metadata across pages** — every page needs unique title and description. Use generateMetadata dynamically, never hardcode the same string.
3. **JavaScript-rendered content** — Google renders JS but AI crawlers may not. Ensure SSR or SSG for all indexable content. Test with \`curl\` to verify.
4. **Canonical conflicts** — a page with both a self-referencing canonical and a redirect will confuse crawlers. Pick one source of truth.
5. **llms.txt freshness** — AI crawlers cache aggressively. Update llms.txt and llms-full.txt whenever you publish or remove important pages.
6. **Over-optimizing for one AI platform** — each AI search engine weights signals differently. Optimize for the union of signals, not a single platform.

## Evaluation criteria

- [ ] Every indexable page has a unique title, meta description, and canonical URL
- [ ] Primary keyword appears in title, H1, first 100 words, and at least one subheading
- [ ] JSON-LD is valid (test with Google Rich Results Test)
- [ ] Entity coverage matches or exceeds top 3 SERP competitors
- [ ] llms.txt exists at the site root and is current
- [ ] Page loads with SSR/SSG — content visible without JS execution
- [ ] Core Web Vitals pass (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- [ ] No duplicate canonical URLs across the site`,
    agentDocs: {
      codex: `# Codex — Google SEO & GEO

## Environment
- Codex runs sandboxed: file I/O and shell only, no browser, no GUI
- Network is restricted — use local file reads for content analysis
- Working directory is the Next.js project root

## Directives
- When creating or editing pages, always include generateMetadata
- Add JSON-LD structured data for every content page (Article, Product, FAQ)
- Create or update public/llms.txt when content structure changes
- Use SSR or SSG — never client-only rendering for indexable pages
- Check that canonical URLs are self-referencing and unique per page

## Tool usage
- Read page files to audit metadata completeness
- Use shell to run build and verify SSR output with curl-equivalent checks
- Write JSON-LD components as separate reusable files (e.g. components/article-jsonld.tsx)
- Use grep/ripgrep to find pages missing generateMetadata exports

## Testing expectations
- After metadata changes, run pnpm build to verify no type errors
- Validate JSON-LD output by checking rendered HTML for script[type="application/ld+json"]
- Verify llms.txt is accessible at /llms.txt in the build output

## Common failure modes
- Missing await on params in generateMetadata (Next.js 15+ async params): verify async destructuring
- JSON-LD with unescaped characters breaking JSON.parse: always use JSON.stringify
- Canonical URL mismatch between generateMetadata and sitemap.ts: cross-check both files

## Output format
- Write changes directly to files and summarize metadata additions
- List all pages that were updated with before/after metadata comparison
- Flag any pages still missing metadata after the update`,

      cursor: `# Cursor — Google SEO & GEO

## IDE context
- Full project access via file editing, search, and terminal
- Linter feedback is available in real time for TypeScript and metadata types
- Use multi-file search to find all page.tsx files that need metadata

## Code generation rules
- Always generate generateMetadata as an async function with proper typing
- Import Metadata type from "next" — never use inline type annotations
- Place JSON-LD components in a shared components/ directory, not inline
- Use template literals for dynamic URLs; never hardcode domains

## Code style
- Follow existing project patterns for metadata exports
- Use the same OG image dimensions consistently (1200x630 default)
- Keep meta descriptions between 120-155 characters
- Prefer named exports for JSON-LD components

## Features to leverage
- Use multi-file edit to add generateMetadata across all page.tsx files at once
- Use search to find all instances of hardcoded titles or descriptions
- Run pnpm build in terminal to catch metadata type errors
- Check linter output for missing return types on metadata functions

## Review checklist
- [ ] Every page.tsx in app/ exports generateMetadata or has a parent layout metadata
- [ ] All canonical URLs use the production domain, not localhost
- [ ] OG images exist and are the correct dimensions
- [ ] No duplicate title or description strings across pages
- [ ] JSON-LD components are reusable and accept props, not hardcoded`,

      claude: `# Claude — Google SEO & GEO

## Interaction patterns
- When the user asks about SEO, determine whether they need classic Google SEO, GEO, or both
- Ask which pages or content types need optimization before proceeding
- If the user provides a URL, analyze it for missing SEO signals before suggesting changes
- Structure responses as audit findings first, then implementation code

## Response structure
1. **Current state assessment** — what metadata and structured data exists now
2. **Gap analysis** — what is missing compared to best practices
3. **Implementation plan** — ordered list of changes by impact
4. **Code examples** — ready-to-paste Next.js metadata and JSON-LD
5. **Verification steps** — how to confirm changes are working

## Chain-of-thought guidance
- Think through keyword cannibalization before suggesting new metadata
- Consider the page's position in the site hierarchy when setting canonicals
- Evaluate whether the content is substantial enough to rank before optimizing
- Flag when thin content should be expanded rather than just tagged

## Output formatting
- Use tables for entity gap analysis and platform signal matrices
- Use code blocks with typescript tags for all Next.js code
- Use checklists for audit results
- Keep explanations concise — link to Google's documentation for deep dives

## Constraints
- Never suggest keyword stuffing or manipulative SEO tactics
- Always recommend ethical, white-hat SEO practices
- Do not fabricate search volume numbers — suggest tools for real data
- Respect robots.txt and noindex directives — do not suggest overriding them`,

      agents: `# AGENTS.md — Google SEO & GEO

## Purpose
Ensure every indexable page has complete, accurate metadata, structured data,
and AI citability signals for both Google organic and generative search engines.

## Review checklist
1. Every page.tsx exports generateMetadata or inherits from a layout
2. All meta descriptions are unique, 120-155 characters, and include the primary keyword
3. Canonical URLs are consistent between generateMetadata and sitemap.ts
4. JSON-LD structured data validates with Google Rich Results Test
5. llms.txt exists at the site root and lists all key content pages
6. Entity coverage is at parity with top 3 SERP competitors
7. No JavaScript-only rendering for any indexable content

## Quality gates
- Page passes Google Rich Results Test with no errors
- Core Web Vitals are within acceptable thresholds
- SSR output contains all metadata visible to curl
- No duplicate titles or descriptions across the site

## Related skills
- schema-markup: detailed JSON-LD patterns for every schema type
- technical-seo-audit: crawlability, robots.txt, sitemaps, and Search Console
- ai-citability: deep dive into GEO and AI search optimization
- content-seo-strategy: topic clusters, pillar pages, and content planning

## Escalation criteria
- Escalate to a human when manual Search Console actions are needed
- Escalate when a Google penalty or manual action is suspected
- Escalate when site-wide canonical or redirect architecture needs redesign`
    }
  },

  // -------------------------------------------------------------------------
  // 2. Schema.org Markup
  // -------------------------------------------------------------------------
  {
    slug: "schema-markup",
    title: "Schema.org Markup",
    description:
      "Schema.org JSON-LD structured data for Google rich snippets, knowledge panels, and AI search grounding — Article, Product, FAQ, HowTo, and more.",
    category: "seo-geo",
    accent: "signal-blue",
    tags: ["schema", "json-ld", "structured-data", "rich-snippets", "seo"],
    body: `# Schema.org Markup

Implement JSON-LD structured data that earns rich snippets in Google,
powers knowledge panels, and grounds AI search answers with verified
structured information. Covers Article, Product, FAQ, HowTo,
BreadcrumbList, Organization, and WebSite schemas.

## When to use

- Adding structured data to any content page for rich snippet eligibility
- Building product pages that need price, rating, and availability snippets
- Creating FAQ sections that should expand in Google search results
- Writing how-to guides that benefit from step-by-step rich results
- Setting up organization-level schema for knowledge panels
- Grounding AI search results with verified, structured claims

## When NOT to use

- Pages behind authentication that Google cannot crawl
- Content that does not match any Schema.org type — do not force-fit
- Microsites with no organic search strategy
- When the content violates Google's structured data guidelines (e.g., marking non-FAQ content as FAQ)

## Core concepts

| Concept | Description |
|---------|-------------|
| JSON-LD | JavaScript Object Notation for Linked Data — Google's preferred structured data format |
| @context | Always \`https://schema.org\` — declares the vocabulary |
| @type | The Schema.org entity type (Article, Product, FAQ, etc.) |
| Nesting | Embedding related entities within a parent (e.g., Author within Article) |
| @id | A canonical URI for the entity, enabling cross-referencing between schemas |
| ItemList | A wrapper for ordered or unordered lists of schema items |
| Rich snippet | Enhanced SERP display triggered by valid structured data |
| Eligibility | Not all schema types trigger rich results — only Google-supported types |

## Workflow

### Step 1: Identify the correct schema type

Match your content to the most specific Schema.org type:

| Content type | Schema.org type | Rich result type |
|-------------|----------------|-----------------|
| Blog post / news article | Article, NewsArticle, BlogPosting | Article snippet |
| Product page | Product | Price, rating, availability |
| FAQ section | FAQPage | Expandable Q&A |
| Tutorial / guide | HowTo | Step-by-step display |
| Breadcrumb nav | BreadcrumbList | Breadcrumb trail |
| Site-wide search | WebSite + SearchAction | Sitelinks search box |
| Business info | Organization, LocalBusiness | Knowledge panel |

### Step 2: Build the JSON-LD component

Create a reusable React component for each schema type.

#### Article schema

\`\`\`typescript
type ArticleJsonLdProps = {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  authorName: string;
  publishedAt: string;
  modifiedAt: string;
};

export function ArticleJsonLd(props: ArticleJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: props.title,
    description: props.description,
    url: props.url,
    image: props.imageUrl,
    author: { "@type": "Person", name: props.authorName },
    publisher: {
      "@type": "Organization",
      name: "YourBrand",
      logo: {
        "@type": "ImageObject",
        url: "https://yourbrand.com/logo.png",
      },
    },
    datePublished: props.publishedAt,
    dateModified: props.modifiedAt,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
\`\`\`

#### Product schema

\`\`\`typescript
type ProductJsonLdProps = {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  availability: "InStock" | "OutOfStock" | "PreOrder";
  ratingValue?: number;
  reviewCount?: number;
  sku: string;
  brand: string;
};

export function ProductJsonLd(props: ProductJsonLdProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: props.name,
    description: props.description,
    image: props.imageUrl,
    sku: props.sku,
    brand: { "@type": "Brand", name: props.brand },
    offers: {
      "@type": "Offer",
      price: props.price,
      priceCurrency: props.currency,
      availability: \`https://schema.org/\${props.availability}\`,
    },
  };
  if (props.ratingValue != null) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: props.ratingValue,
      reviewCount: props.reviewCount ?? 0,
    };
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
\`\`\`

#### FAQ schema

\`\`\`typescript
type FaqItem = { question: string; answer: string };

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
\`\`\`

#### HowTo schema

\`\`\`typescript
type HowToStep = { name: string; text: string; imageUrl?: string };

export function HowToJsonLd({
  title,
  steps,
}: {
  title: string;
  steps: HowToStep[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.imageUrl ? { image: s.imageUrl } : {}),
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
\`\`\`

### Step 3: Add BreadcrumbList schema

\`\`\`typescript
type Crumb = { name: string; url: string };

export function BreadcrumbJsonLd({ crumbs }: { crumbs: Crumb[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
\`\`\`

### Step 4: Validate with Google Rich Results Test

1. Deploy or preview the page
2. Run it through https://search.google.com/test/rich-results
3. Fix any warnings or errors before shipping
4. Re-validate after every schema change

## Examples

### Example 1: Organization schema in root layout

\`\`\`typescript
// app/layout.tsx — add to <head> section
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "YourBrand",
  url: "https://yourbrand.com",
  logo: "https://yourbrand.com/logo.png",
  sameAs: [
    "https://twitter.com/yourbrand",
    "https://github.com/yourbrand",
    "https://linkedin.com/company/yourbrand",
  ],
};
\`\`\`

### Example 2: WebSite with sitelinks search box

\`\`\`typescript
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "YourBrand",
  url: "https://yourbrand.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://yourbrand.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};
\`\`\`

## Decision tree

- Blog post or article → use Article or BlogPosting with author and dates
- Product with price → use Product with Offer; add AggregateRating if reviews exist
- FAQ section with Q&A pairs → use FAQPage; ensure answers are substantive (not just links)
- Step-by-step tutorial → use HowTo with ordered steps
- Breadcrumb navigation → use BreadcrumbList on every page
- Homepage or root layout → add Organization and WebSite schemas
- Multiple schema types on one page → use multiple script tags; do not combine into one object

## Edge cases and gotchas

1. **FAQ schema abuse** — Google may ignore FAQ schema if the content is not genuinely question-and-answer format. Do not mark marketing copy as FAQ.
2. **Missing required fields** — each schema type has required properties. A Product without \`offers\` will not trigger rich results. Always check the Google documentation.
3. **Price format** — use numeric values without currency symbols. \`"price": 29.99\` not \`"price": "$29.99"\`.
4. **Date format** — use ISO 8601 format (\`2025-01-15T10:00:00Z\`). Relative dates ("2 days ago") are invalid.
5. **Image requirements** — Article rich results require images at least 1200px wide. Smaller images may silently prevent rich results.
6. **Over-nesting** — deeply nested schemas are harder to maintain and debug. Keep nesting to 2-3 levels maximum.

## Evaluation criteria

- [ ] JSON-LD validates with zero errors in Google Rich Results Test
- [ ] Each page uses the most specific applicable schema type
- [ ] All required fields per Google's documentation are present
- [ ] Schema components are reusable React components with typed props
- [ ] No schema type misuse (e.g., FAQ for non-FAQ content)
- [ ] Organization and WebSite schemas are present in the root layout
- [ ] Dates use ISO 8601 format; prices use numeric values`,
    agentDocs: {
      codex: `# Codex — Schema.org Markup

## Environment
- Codex runs sandboxed: file I/O and shell only, no browser
- Cannot access Google Rich Results Test directly — generate code that can be validated externally
- Working directory is the Next.js project root

## Directives
- Create JSON-LD components as separate, reusable TypeScript files in components/
- Each component must accept typed props — never hardcode entity data
- Use JSON.stringify for schema output — never manually construct JSON strings
- Always include @context and @type as the first two properties
- Add Organization and WebSite schemas to the root layout.tsx

## Tool usage
- Read existing page files to determine which schema types are needed
- Use grep to find pages that already have JSON-LD and check for correctness
- Write new components to components/schema/ directory
- Run pnpm build to verify TypeScript types compile correctly

## Testing expectations
- After creating schema components, run pnpm build to catch type errors
- Verify rendered HTML includes script[type="application/ld+json"] tags
- Validate JSON output is parseable with JSON.parse

## Common failure modes
- Forgetting dangerouslySetInnerHTML wrapper for script tag: always use it
- Using string interpolation inside JSON.stringify: pass the object directly
- Missing @context field: always include "https://schema.org"

## Output format
- List each schema component created with its file path and props interface
- Summarize which pages need to import which schema components
- Flag any schema types that are missing required fields`,

      cursor: `# Cursor — Schema.org Markup

## IDE context
- Full project access via file editing, search, and terminal
- TypeScript linting catches type errors in schema component props
- Use search to find all existing JSON-LD implementations

## Code generation rules
- Create one component per schema type in components/schema/
- Every component must have a TypeScript props type exported alongside it
- Use dangerouslySetInnerHTML with JSON.stringify — never template literals for JSON
- Place multiple schemas on one page as separate script tags, not merged objects
- Import and render schema components in the page-level server component

## Code style
- Name files after the schema type: article-jsonld.tsx, product-jsonld.tsx
- Export both the component and its props type
- Use "https://schema.org" — never abbreviate the context URL
- Keep schema objects flat when possible; nest only when semantically required

## Features to leverage
- Multi-file edit to add schema components across many pages simultaneously
- Search for dangerouslySetInnerHTML to audit existing schema implementations
- Terminal to run pnpm build and check for type errors after changes
- Linter output for catching missing props in schema components

## Review checklist
- [ ] Each schema component lives in its own file under components/schema/
- [ ] Props types are exported and fully typed (no any)
- [ ] All required Schema.org fields are present per Google docs
- [ ] Schema output is valid JSON (verified via JSON.stringify)
- [ ] Root layout includes Organization and WebSite schemas`,

      claude: `# Claude — Schema.org Markup

## Interaction patterns
- When the user asks about structured data, identify the content type first
- Recommend the most specific Schema.org type before generating code
- If the user provides a page URL or content, analyze it to suggest the right schema
- Always link to the relevant Google structured data documentation

## Response structure
1. **Content type identification** — what kind of content needs schema
2. **Schema type recommendation** — which Schema.org type to use and why
3. **Component code** — ready-to-use React component with typed props
4. **Integration example** — how to import and use in the target page
5. **Validation instructions** — how to verify with Google Rich Results Test

## Chain-of-thought guidance
- Check if the content type is eligible for rich results before suggesting schema
- Consider whether the content genuinely matches the schema type
- Think about required vs. recommended properties — include all required, most recommended
- Flag when a schema type won't trigger rich results (informational-only schemas)

## Output formatting
- Use TypeScript code blocks for all component code
- Use tables to map content types to schema types
- Include the full component including import statements
- Add inline comments only for non-obvious property choices

## Constraints
- Never suggest schema types that misrepresent the content
- Always include all required properties per Google's documentation
- Do not suggest deprecated schema properties
- Warn when schema implementation requires content changes (not just code)`,

      agents: `# AGENTS.md — Schema.org Markup

## Purpose
Generate and maintain JSON-LD structured data components for Google rich
snippets and AI search grounding across all content pages.

## Review checklist
1. Every content page has the appropriate JSON-LD schema type
2. All required properties per Google's documentation are present
3. Schema components are reusable with typed props (no hardcoded data)
4. Organization and WebSite schemas exist in the root layout
5. FAQ schemas only used for genuine question-and-answer content
6. Dates use ISO 8601 format; prices use numeric values without symbols
7. Images referenced in schema meet minimum dimension requirements

## Quality gates
- JSON-LD output is valid JSON (parseable by JSON.parse)
- TypeScript compiles without errors (pnpm build passes)
- No schema type misuse per Google's structured data guidelines
- Each schema component is in its own file under components/schema/

## Related skills
- seo-geo: broader SEO and GEO optimization that includes schema as a component
- technical-seo-audit: crawlability and indexing that affect schema visibility
- ai-citability: how structured data feeds into AI search citation

## Escalation criteria
- Escalate to a human when Google Rich Results Test shows persistent errors
- Escalate when a schema type has no documented Google support for rich results
- Escalate when schema implementation requires significant content restructuring`
    }
  },

  // -------------------------------------------------------------------------
  // 3. Google Technical SEO Audit
  // -------------------------------------------------------------------------
  {
    slug: "technical-seo-audit",
    title: "Google Technical SEO Audit",
    description:
      "Google Search Console crawlability, indexing, site speed, canonicalization, robots.txt, sitemaps, and Core Web Vitals from the search infrastructure perspective.",
    category: "seo-geo",
    accent: "signal-blue",
    tags: ["technical-seo", "crawlability", "indexing", "sitemap", "audit"],
    body: `# Google Technical SEO Audit

A systematic audit of your site's crawlability, indexing, and technical
health from Google's perspective. Covers robots.txt, sitemaps, canonical
URLs, redirect chains, Core Web Vitals, and Search Console diagnostics.

## When to use

- Launching a new site or redesigning an existing one
- Diagnosing sudden drops in Google organic traffic
- Migrating domains, changing URL structures, or consolidating subdomains
- Setting up or auditing robots.txt and sitemap files for a Next.js app
- Verifying that server-rendered content is accessible to Googlebot
- Preparing for a Core Web Vitals assessment

## When NOT to use

- Content quality and keyword strategy — use **keyword-research** and **content-seo-strategy**
- Schema markup specifics — use **schema-markup**
- Social media metadata (OG tags for sharing) — that is on-page SEO
- Paid search (Google Ads) campaigns

## Core concepts

| Concept | Description |
|---------|-------------|
| Crawl budget | The number of pages Googlebot will crawl per visit; wasted on low-value URLs |
| Index coverage | Which pages are indexed vs. excluded and why (via Search Console) |
| Canonical URL | The single authoritative URL for a page when duplicates exist |
| robots.txt | A file at the site root that controls crawler access to paths |
| sitemap.xml | An XML file listing all indexable URLs with metadata |
| Redirect chain | Multiple sequential redirects (301 → 301 → 200) that waste crawl budget |
| Core Web Vitals | LCP, CLS, INP — Google's page experience metrics |
| Rendering mode | SSR, SSG, ISR, or CSR — affects whether Googlebot sees content on first crawl |

## Workflow

### Step 1: Audit robots.txt

Check your \`public/robots.txt\` or generate it dynamically with Next.js:

\`\`\`typescript
// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourbrand.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/_next/"],
      },
      {
        userAgent: "GPTBot",
        allow: "/blog/",
        disallow: "/",
      },
    ],
    sitemap: \`\${baseUrl}/sitemap.xml\`,
  };
}
\`\`\`

### Step 2: Generate a dynamic sitemap

\`\`\`typescript
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllProducts } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourbrand.com";
  const posts = await getAllPosts();
  const products = await getAllProducts();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: \`\${baseUrl}/about\`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: \`\${baseUrl}/pricing\`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: \`\${baseUrl}/blog/\${post.slug}\`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: \`\${baseUrl}/products/\${product.slug}\`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...postPages, ...productPages];
}
\`\`\`

### Step 3: Verify canonical URLs

Ensure every page sets a self-referencing canonical via generateMetadata:

\`\`\`typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    alternates: {
      canonical: \`https://yourbrand.com/blog/\${slug}\`,
    },
  };
}
\`\`\`

Rules for canonicals:
- Always use the production domain, not localhost or preview URLs
- Prefer HTTPS over HTTP
- Prefer non-www over www (or vice versa) — be consistent
- Remove query parameters from canonical URLs unless they change content
- Canonical must match the URL in sitemap.xml

### Step 4: Audit redirect chains

Find and fix redirect chains longer than one hop:

1. Crawl the site with a tool like Screaming Frog or a script
2. Identify any 301 → 301 → 200 chains
3. Update the first redirect to point directly to the final destination
4. Update internal links to use the final URL directly

\`\`\`typescript
// next.config.ts — clean redirects
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/old-path",
        destination: "/new-path",
        permanent: true,
      },
      {
        source: "/legacy/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
\`\`\`

### Step 5: Check rendering and indexability

\`\`\`bash
# Verify SSR content is visible without JavaScript
curl -s https://yourbrand.com/blog/my-post | head -100

# Check robots.txt is served correctly
curl -s https://yourbrand.com/robots.txt

# Verify sitemap is accessible
curl -s https://yourbrand.com/sitemap.xml | head -50

# Check for X-Robots-Tag headers
curl -I https://yourbrand.com/blog/my-post 2>/dev/null | rg -i "x-robots"
\`\`\`

### Step 6: Core Web Vitals audit

| Metric | Threshold | Common fix |
|--------|-----------|-----------|
| LCP (Largest Contentful Paint) | < 2.5s | Optimize images, preload critical assets, reduce server response time |
| CLS (Cumulative Layout Shift) | < 0.1 | Set explicit dimensions on images/videos, avoid dynamic content above the fold |
| INP (Interaction to Next Paint) | < 200ms | Reduce JavaScript execution, defer non-critical scripts, use web workers |

## Examples

### Example 1: Complete robots.txt for a SaaS site

\`\`\`text
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /dashboard/

User-agent: GPTBot
Allow: /blog/
Allow: /docs/
Disallow: /

Sitemap: https://yourbrand.com/sitemap.xml
\`\`\`

### Example 2: Middleware for trailing slash normalization

\`\`\`typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 308);
  }
}

export const config = { matcher: "/((?!api|_next|favicon.ico).*)" };
\`\`\`

## Decision tree

- New site launch → set up robots.ts, sitemap.ts, canonical URLs, and verify SSR output
- Traffic drop → check Search Console index coverage report for excluded pages
- Domain migration → create a comprehensive redirect map and verify in Search Console
- Slow pages → audit Core Web Vitals; start with LCP, then CLS, then INP
- Pages not indexing → check robots.txt, noindex headers, canonical conflicts, and crawl budget
- Duplicate content → implement canonical URLs and consolidate thin pages

## Edge cases and gotchas

1. **Preview/staging URLs indexed** — search engines may index Vercel preview URLs. Add \`X-Robots-Tag: noindex\` header for non-production deployments via middleware.
2. **Soft 404s** — pages that return 200 but show error content. Google treats these as low quality. Return proper 404 status codes via \`notFound()\`.
3. **Sitemap size limits** — sitemaps have a 50,000 URL / 50MB limit. For larger sites, use sitemap index files that reference multiple sitemaps.
4. **hreflang conflicts** — if implementing multilingual SEO, hreflang annotations must be bidirectional. Page A → Page B requires Page B → Page A.
5. **robots.txt cached by Google** — changes to robots.txt may take hours to days to propagate. Use Search Console to request a re-crawl.
6. **Redirect loops** — a → b → a creates an infinite loop. Always test redirect chains before deploying.

## Evaluation criteria

- [ ] robots.txt exists and correctly allows/disallows paths
- [ ] sitemap.xml is generated dynamically and includes all indexable URLs
- [ ] Every page has a self-referencing canonical URL
- [ ] No redirect chains longer than one hop
- [ ] SSR output is visible without JavaScript execution
- [ ] Core Web Vitals pass (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- [ ] No preview/staging URLs are indexable in production
- [ ] Search Console shows no critical indexing errors`,
    agentDocs: {
      codex: `# Codex — Google Technical SEO Audit

## Environment
- Codex runs sandboxed: file I/O and shell only, no browser or GUI
- Cannot access Google Search Console directly — generate configs that are externally verifiable
- Working directory is the Next.js project root

## Directives
- Generate robots.ts and sitemap.ts using Next.js MetadataRoute types
- Create middleware for trailing slash normalization and non-production noindex headers
- Audit next.config redirects for chains and loops
- Verify SSR output by checking build output files
- Set canonical URLs via generateMetadata in every page component

## Tool usage
- Read next.config.ts for existing redirects and rewrite rules
- Use grep to find all page.tsx files and check for generateMetadata exports
- Read middleware.ts for existing request handling logic
- Write robots.ts and sitemap.ts as Next.js convention files in app/
- Run pnpm build to verify configuration compiles correctly

## Testing expectations
- After changes, run pnpm build and verify no errors
- Check that robots.txt and sitemap.xml are in the build output
- Verify redirect destinations resolve to 200 status codes
- Confirm no circular redirect patterns exist in next.config.ts

## Common failure modes
- robots.ts not exporting a default function: must be a default export
- sitemap.ts returning empty array when data fetch fails: add error handling
- Canonical URLs using localhost instead of production domain: use env variable
- Middleware matching API routes and breaking them: exclude /api/ in matcher

## Output format
- List all files created or modified with summaries
- Flag any pages missing canonical URLs or generateMetadata
- Report redirect chain analysis results`,

      cursor: `# Cursor — Google Technical SEO Audit

## IDE context
- Full project access via file editing, search, and terminal
- TypeScript linting validates robots.ts and sitemap.ts types
- Terminal available for curl testing and build verification

## Code generation rules
- Use Next.js MetadataRoute types for robots.ts and sitemap.ts
- Place middleware.ts at the project root (not inside app/)
- Use environment variables for base URLs — never hardcode domains
- Export async functions from sitemap.ts when data fetching is needed
- Follow existing redirect patterns in next.config.ts

## Code style
- Use the same base URL variable consistently across robots, sitemap, and metadata
- Keep redirect rules ordered: most specific first, catch-all last
- Use permanent: true for 301 redirects, permanent: false for 302
- Add type annotations to all redirect and sitemap return values

## Features to leverage
- Search for all page.tsx files to audit metadata coverage
- Multi-file edit for adding canonical URLs across many pages
- Terminal for running curl checks against dev server
- Linter output for catching type mismatches in MetadataRoute types

## Review checklist
- [ ] robots.ts and sitemap.ts use MetadataRoute types correctly
- [ ] Base URL comes from environment variable, not hardcoded
- [ ] Middleware excludes /api/ and /_next/ from processing
- [ ] No redirect chains longer than one hop in next.config.ts
- [ ] All page.tsx files export generateMetadata with canonical URL`,

      claude: `# Claude — Google Technical SEO Audit

## Interaction patterns
- When the user asks about technical SEO, determine the scope: full audit or specific issue
- Ask about the framework (Next.js, Remix, etc.) before generating code
- If the user reports a traffic drop, start with indexing and crawl diagnostics
- Structure responses as findings with severity levels

## Response structure
1. **Scope confirmation** — what part of the technical stack is being audited
2. **Findings** — ordered by severity (critical, warning, info)
3. **Implementation fixes** — code for each finding
4. **Verification steps** — how to confirm each fix works
5. **Monitoring setup** — ongoing checks to prevent regression

## Chain-of-thought guidance
- Check robots.txt before sitemap — blocked pages won't be in the index regardless
- Verify canonical URLs match sitemap URLs — mismatches cause confusion
- Consider rendering mode before diagnosing indexing issues — CSR pages may not be crawled
- Think about redirect chains holistically — fixing one may create another

## Output formatting
- Use severity badges (Critical / Warning / Info) for findings
- Use code blocks for all configuration and middleware code
- Use tables for Core Web Vitals thresholds and redirect chain analysis
- Include curl commands for manual verification

## Constraints
- Never suggest removing robots.txt entirely — always provide a valid configuration
- Do not recommend noindex on pages the user wants indexed
- Warn before suggesting redirect changes that could affect existing traffic
- Always verify URL patterns before implementing wildcard redirects`,

      agents: `# AGENTS.md — Google Technical SEO Audit

## Purpose
Audit and fix the technical SEO infrastructure of a Next.js site: robots.txt,
sitemaps, canonical URLs, redirects, rendering, and Core Web Vitals.

## Review checklist
1. robots.ts exists and uses Next.js MetadataRoute.Robots type
2. sitemap.ts generates all indexable URLs dynamically
3. Every page exports generateMetadata with a canonical URL
4. No redirect chains longer than one hop in next.config.ts
5. Middleware handles trailing slash normalization and non-production noindex
6. SSR output contains all content visible to crawlers
7. Core Web Vitals are within acceptable thresholds

## Quality gates
- pnpm build completes without errors after changes
- robots.txt and sitemap.xml are present in build output
- No circular redirect patterns detected
- Canonical URLs use the production domain consistently

## Related skills
- seo-geo: broader SEO optimization including on-page and GEO
- schema-markup: structured data that complements technical SEO
- ai-citability: AI crawler access configuration that overlaps with robots.txt

## Escalation criteria
- Escalate when Google Search Console shows manual actions
- Escalate when a domain migration requires DNS and server-level changes
- Escalate when Core Web Vitals failures are caused by infrastructure (CDN, hosting)`
    }
  },

  // -------------------------------------------------------------------------
  // 4. AI Citability & GEO
  // -------------------------------------------------------------------------
  {
    slug: "ai-citability",
    title: "AI Citability & GEO",
    description:
      "Generative engine optimization for AI search: making content citable by ChatGPT, Perplexity, Gemini, and Bing AI through entity density, structured answers, and llms.txt.",
    category: "seo-geo",
    accent: "signal-blue",
    tags: ["geo", "aeo", "ai-search", "citability", "llms-txt"],
    body: `# AI Citability & GEO

Generative Engine Optimization (GEO) makes your content citable by
AI search engines — ChatGPT Browse, Perplexity, Gemini, and Bing AI.
Unlike traditional SEO, GEO focuses on entity density, structured
answers, factual verifiability, and machine-readable content signals
that AI models use to select and attribute sources.

## When to use

- Optimizing content for citation by ChatGPT, Perplexity, or Gemini
- Building pages that answer questions AI search users are likely to ask
- Implementing llms.txt and llms-full.txt for AI crawler discovery
- Improving the factual density and entity coverage of existing content
- Structuring answers so AI models can extract and attribute them cleanly
- Measuring and improving your AI citability score

## When NOT to use

- Content behind authentication or paywalls that AI crawlers cannot access
- Ephemeral content (event announcements, time-limited promotions) — AI search lags
- When the goal is solely Google SERP ranking — use **seo-geo** for the combined approach
- Internal documentation not intended for external search

## Core concepts

| Concept | Description |
|---------|-------------|
| GEO (Generative Engine Optimization) | Optimizing content for AI search engine citation and extraction |
| AEO (Answer Engine Optimization) | Subset of GEO focused on direct-answer extraction |
| Entity density | Number of named entities (people, products, specs, dates) per paragraph |
| Factual density | Ratio of verifiable claims and statistics to total content |
| Citation probability | Likelihood that an AI model will cite your page for a given query |
| llms.txt | Machine-readable file listing priority content for AI crawlers |
| Structured answer | A self-contained paragraph that directly answers a specific question |
| Attribution signal | Elements that help AI models credit your content (authorship, dates, org info) |

## Workflow

### Step 1: Implement llms.txt

Create the standard llms.txt file at your site root:

\`\`\`text
# YourBrand llms.txt
# Spec: https://llmstxt.org

> YourBrand is a developer platform for building and deploying X.

## Documentation
- [Getting Started](https://yourbrand.com/docs/start): Quick-start guide for new users
- [API Reference](https://yourbrand.com/docs/api): Complete API documentation
- [Architecture](https://yourbrand.com/docs/architecture): System design and data flow

## Blog
- [How We Built X](https://yourbrand.com/blog/how-we-built-x): Technical deep-dive
- [Performance Benchmarks](https://yourbrand.com/blog/benchmarks): Latest performance data
\`\`\`

### Step 2: Create llms-full.txt

The full version inlines key content for AI crawlers that prefer complete text:

\`\`\`text
# YourBrand llms-full.txt

> YourBrand is a developer platform for building and deploying X.

## Getting Started

YourBrand provides a CLI and SDK for building applications. Install with:
npm install @yourbrand/sdk

Initialize a new project:
npx yourbrand init my-app

[Complete getting-started content inlined here]
\`\`\`

### Step 3: Structure content for AI extraction

Write content with "structured answer" blocks — self-contained paragraphs
that directly answer a specific question without requiring surrounding context.

**Before (low citability):**
> We've been working on improving our product's speed. The results have been
> really great and users are happy.

**After (high citability):**
> YourBrand v3.2 reduced API response latency by 47% compared to v3.1,
> dropping the p99 from 340ms to 180ms. The improvement was achieved by
> migrating from PostgreSQL full-text search to a dedicated Typesense
> index, measured across 2.1 million production queries in January 2025.

### Step 4: Score factual density

Evaluate each paragraph against this rubric:

| Signal | Weight | Description |
|--------|--------|-------------|
| Named entity | 2 | Specific product, person, company, or technology name |
| Statistic | 3 | Numeric data with context (percentages, counts, dates) |
| Comparison | 2 | Explicit comparison ("X is 3x faster than Y") |
| Source citation | 2 | Reference to a study, benchmark, or official source |
| Technical spec | 1 | Version numbers, API endpoints, configuration values |
| Temporal anchor | 1 | Specific date or time period |

A paragraph with a factual density score of 8+ is highly citable.
Below 4 is unlikely to be cited by AI models.

### Step 5: Platform-specific optimization

| Platform | Primary signal | Secondary signal | Strategy |
|----------|---------------|-----------------|----------|
| ChatGPT Browse | Entity density, direct answers | Domain authority, freshness | Lead with one-sentence answers, back with data |
| Perplexity | Source diversity, inline citations | Structured answers, comparisons | Include inline references, cite primary sources |
| Gemini | Schema markup, entity graphs | Factual density, Knowledge Graph alignment | Maximize JSON-LD, align entities with Google KG |
| Bing AI | OpenGraph, structured data | FAQ schema, recency | Complete OG tags, FAQ schema, keep content updated |

### Step 6: Measure AI citability

Track your citation performance:

1. Search for your brand/product queries in each AI search engine
2. Record whether your content is cited, paraphrased, or absent
3. Score each query result: cited (3), paraphrased (1), absent (0)
4. Calculate citation rate: total score / (total queries × 3)
5. Target a citation rate above 0.5 for your primary keyword set

## Examples

### Example 1: Converting thin content to high-citability

\`\`\`markdown
# Before (factual density: 2)
Our tool is fast and easy to use. Developers love it because it saves
them time. Get started today!

# After (factual density: 11)
YourBrand SDK processes 50,000 API requests per second on a single
c6g.xlarge instance, compared to 12,000 req/s for Alternative-X
(benchmarked March 2025, Apache JMeter, 100 concurrent connections).
The SDK requires three lines of initialization code and supports
TypeScript, Python, and Go with auto-generated types from OpenAPI 3.1
specifications.
\`\`\`

### Example 2: Structured answer block

\`\`\`markdown
## What is YourBrand's pricing?

YourBrand offers three plans: Free (up to 1,000 API calls/month),
Pro ($49/month, up to 100,000 API calls), and Enterprise (custom
pricing, unlimited calls with dedicated infrastructure). All plans
include TypeScript and Python SDKs, webhook support, and 99.9% uptime
SLA. Annual billing discounts are 20% for Pro plans. Enterprise plans
include SOC 2 compliance reports and custom SLA terms.
\`\`\`

## Decision tree

- Content is brand new → write with structured answers and high entity density from the start
- Existing content, low traffic → rewrite paragraphs to increase factual density above 8
- Already ranking in Google → add GEO signals (llms.txt, entity density) without changing structure
- Content is technical docs → focus on inline code examples, version numbers, and API specs
- Content is thought leadership → focus on named comparisons, statistics, and temporal anchors
- Not sure where to start → run a citability audit on your top 10 pages first

## Edge cases and gotchas

1. **AI crawler blocking** — if robots.txt blocks GPTBot or similar crawlers, your content will never be cited. Check robots.txt explicitly for AI user agents.
2. **Stale statistics** — AI models may cite outdated numbers from cached versions of your content. Always include dates with statistics and update them regularly.
3. **Over-optimization** — cramming entities and stats into every sentence makes content unreadable. Aim for natural language with strategically placed factual anchors.
4. **llms.txt discovery** — there is no universal standard yet. Some AI crawlers look for llms.txt, others do not. Treat it as additive, not a replacement for good content structure.
5. **Attribution stripping** — some AI search engines paraphrase without attribution. You cannot force citation, only maximize the probability by providing uniquely valuable, verifiable data.
6. **Platform divergence** — what works for ChatGPT may not work for Perplexity. Test across multiple platforms and optimize for the union of signals.

## Evaluation criteria

- [ ] llms.txt exists at the site root and is up to date
- [ ] llms-full.txt provides inline content for key pages
- [ ] Average factual density per paragraph is 6+ on priority pages
- [ ] Every priority page has at least 3 structured answer blocks
- [ ] robots.txt does not block AI search crawlers (GPTBot, PerplexityBot, etc.)
- [ ] Content includes temporal anchors (dates) with all statistics
- [ ] Citation rate across AI search platforms exceeds 0.5 for primary keywords
- [ ] JSON-LD and OG tags are present (cross-check with schema-markup skill)`,
    agentDocs: {
      codex: `# Codex — AI Citability & GEO

## Environment
- Codex runs sandboxed: file I/O and shell only, no browser or GUI
- Cannot test AI search engines directly — focus on content structure and file generation
- Working directory is the Next.js project root

## Directives
- Create or update public/llms.txt and public/llms-full.txt
- Audit content files for factual density and entity coverage
- Check robots.txt to ensure AI crawlers (GPTBot, PerplexityBot) are not blocked
- Add structured answer blocks to content that lacks them
- Generate content audit reports as markdown files

## Tool usage
- Read content files (blog posts, docs) to assess factual density
- Use grep to find pages with low entity density (short paragraphs, no numbers)
- Write llms.txt and llms-full.txt to the public/ directory
- Read robots.ts to verify AI crawler rules
- Use shell to count entities and statistics per file

## Testing expectations
- After llms.txt changes, verify the file is served at /llms.txt in build output
- Check that robots.txt allows GPTBot and PerplexityBot access
- Verify llms-full.txt includes current content (not stale)

## Common failure modes
- llms.txt listing pages that no longer exist: audit links against sitemap
- robots.txt blocking all bots with Disallow: / without AI-specific rules: add explicit allow
- Statistics without dates: always pair numbers with temporal anchors
- llms-full.txt exceeding practical size limits: keep under 500KB

## Output format
- List all files created or modified
- Report factual density scores for audited content
- Flag pages with density below 4 that need rewriting`,

      cursor: `# Cursor — AI Citability & GEO

## IDE context
- Full project access via file editing, search, and terminal
- Can audit content files across the entire project
- Terminal available for build verification and file size checks

## Code generation rules
- Create llms.txt and llms-full.txt as plain text files in public/
- When editing content, preserve existing structure and add factual density
- Include dates with all statistics and benchmark data
- Write structured answer blocks as self-contained paragraphs
- Do not modify robots.ts without explicit user confirmation

## Code style
- llms.txt follows the spec at llmstxt.org — use markdown-like headers and bullet lists
- Use ISO 8601 dates in content when adding temporal anchors
- Keep structured answer blocks between 50-150 words
- Include the source/methodology for all statistics

## Features to leverage
- Search for blog and docs content to audit factual density across the project
- Multi-file edit for adding structured answer blocks to multiple pages
- Terminal for checking file sizes and verifying build output
- Use grep to find paragraphs that contain no numbers or named entities

## Review checklist
- [ ] llms.txt and llms-full.txt exist in public/ and list current pages
- [ ] robots.txt allows GPTBot and PerplexityBot access to content pages
- [ ] Priority content pages have factual density scores of 6+
- [ ] All statistics include dates or version numbers
- [ ] Structured answer blocks are present on pages targeting AI search queries`,

      claude: `# Claude — AI Citability & GEO

## Interaction patterns
- When the user asks about AI search optimization, clarify which platforms they target
- Ask for the user's top 5-10 priority pages before starting a full audit
- If the user provides content, score it for factual density before suggesting changes
- Distinguish between GEO (broad AI optimization) and AEO (answer extraction)

## Response structure
1. **Platform targeting** — which AI search engines the user cares about
2. **Content audit** — factual density and entity coverage assessment
3. **Rewrite suggestions** — before/after examples for low-density paragraphs
4. **File creation** — llms.txt and llms-full.txt content
5. **Measurement plan** — how to track citation performance over time

## Chain-of-thought guidance
- Evaluate whether the content is fundamentally citable before optimizing signals
- Consider whether the content provides unique value or just repeats common knowledge
- Think about the query intent: is the user's content the best answer to the likely query?
- Factor in domain authority — newer domains need higher factual density to compete

## Output formatting
- Use before/after comparisons for content rewrites
- Use tables for platform-specific signal matrices
- Use scoring rubrics with numeric values for factual density
- Include specific entity and statistic counts per paragraph

## Constraints
- Never fabricate statistics or entities to increase density
- Always preserve the author's voice and intent when suggesting rewrites
- Do not suggest misleading structured answers that overstate capabilities
- Warn when the content's topic is too competitive for GEO alone to succeed`,

      agents: `# AGENTS.md — AI Citability & GEO

## Purpose
Optimize content for citation and extraction by AI search engines through
entity density, structured answers, llms.txt, and factual verifiability.

## Review checklist
1. llms.txt exists at site root with current page listings
2. llms-full.txt provides inline content for priority pages
3. robots.txt allows AI crawlers (GPTBot, PerplexityBot, GoogleOther)
4. Priority pages have factual density scores of 6+ per paragraph
5. All statistics include temporal anchors (dates, version numbers)
6. Structured answer blocks are present on question-targeted pages
7. Content is SSR/SSG rendered (not client-only) for AI crawler access

## Quality gates
- llms.txt links resolve to live pages (no 404s)
- No AI crawlers are blocked in robots.txt
- At least 80% of priority pages have structured answer blocks
- Content contains no fabricated statistics or entities

## Related skills
- seo-geo: broader SEO+GEO optimization that includes AI citability as a component
- schema-markup: structured data that feeds AI search entity understanding
- content-seo-strategy: content planning that should incorporate GEO from the start

## Escalation criteria
- Escalate when AI search engines consistently paraphrase without attribution
- Escalate when content quality cannot be improved without subject matter expertise
- Escalate when competitor content dominates AI citations despite your optimization`
    }
  },

  // -------------------------------------------------------------------------
  // 5. Ahrefs Keyword Research
  // -------------------------------------------------------------------------
  {
    slug: "keyword-research",
    title: "Ahrefs Keyword Research",
    description:
      "Intent-mapped keyword clusters with Ahrefs and Semrush, competitor analysis, search volume prioritization, and content gap identification for SEO strategy.",
    category: "seo-geo",
    accent: "signal-blue",
    tags: ["keywords", "research", "intent", "clusters", "strategy"],
    body: `# Ahrefs Keyword Research

Systematic keyword research using Ahrefs and Semrush to build intent-mapped
keyword clusters, perform competitor gap analysis, prioritize by volume and
difficulty, and identify content opportunities that feed your SEO strategy.

## When to use

- Starting a new content strategy and need to identify target keywords
- Planning a content calendar with keyword-driven topic selection
- Analyzing competitors to find ranking opportunities they are missing
- Prioritizing existing content for optimization based on keyword potential
- Building topic clusters for pillar-page architecture
- Validating keyword assumptions before committing to content production

## When NOT to use

- You already have a validated keyword list and need to implement on-page SEO — use **seo-geo**
- The content is not intended for search (internal docs, gated content)
- You need to optimize for AI search specifically — use **ai-citability**
- The site is brand new with zero domain authority — focus on long-tail first

## Core concepts

| Concept | Description |
|---------|-------------|
| Search intent | The user's goal: informational, navigational, transactional, or commercial |
| Keyword difficulty (KD) | Ahrefs metric (0-100) estimating how hard it is to rank on page 1 |
| Search volume | Estimated monthly searches for a keyword in a target country |
| Traffic potential | Estimated organic traffic the top-ranking page gets (broader than search volume) |
| Content gap | Keywords competitors rank for that you do not |
| Keyword cluster | Group of semantically related keywords that can be targeted by a single page |
| SERP features | Rich results (featured snippets, PAA, video) that change click-through dynamics |
| Parent topic | The broader topic Ahrefs assigns to a keyword, identifying cluster opportunities |

## Workflow

### Step 1: Seed keyword brainstorm

Start with 10-20 seed keywords from three sources:

1. **Product/service terms** — what you sell or do
2. **Problem terms** — what pain points your audience has
3. **Audience terms** — what your audience calls themselves or their role

### Step 2: Expand with Ahrefs Keywords Explorer

For each seed keyword in Ahrefs Keywords Explorer:

1. Check "Matching terms" for exact and phrase matches
2. Check "Related terms" for semantic expansions
3. Check "Questions" for informational queries
4. Export results with columns: keyword, volume, KD, traffic potential, parent topic

### Step 3: Run a content gap analysis

In Ahrefs Site Explorer → Content Gap:

1. Enter your domain vs. 3-5 competitors
2. Filter: "Target ranks: Not in top 100" (your site doesn't rank)
3. Filter: At least 2 competitors rank in top 10
4. Export the gap keywords for clustering

### Step 4: Cluster keywords by intent

Group keywords into clusters using the parent topic and manual intent mapping:

| Cluster | Primary keyword | Intent | Volume | KD | Pages needed |
|---------|----------------|--------|--------|----|-------------|
| {topic-1} | "best X for Y" | commercial | 2,400 | 35 | 1 comparison |
| {topic-1} | "X vs Y" | commercial | 1,800 | 28 | 1 comparison |
| {topic-2} | "how to X" | informational | 5,200 | 22 | 1 guide |
| {topic-2} | "X tutorial" | informational | 3,100 | 18 | same page |

### Step 5: Prioritize with a scoring formula

Score each cluster to determine production order:

\`\`\`text
Priority Score = (Volume × 0.3) + (Traffic Potential × 0.3)
               + ((100 - KD) × 0.2) + (Business Value × 0.2)

Business Value scale:
  3 = directly related to product/service
  2 = related to audience pain points
  1 = topically adjacent but indirect
\`\`\`

Sort clusters by Priority Score descending. Produce content for the top
clusters first.

### Step 6: Validate with SERP analysis

Before committing to a cluster, manually check the SERP:

1. What content types dominate? (listicle, guide, tool, product page)
2. What is the average word count of top 3 results?
3. Are there featured snippets or PAA boxes to target?
4. Can you realistically compete with your current domain authority?

If the SERP is dominated by high-authority sites (Wikipedia, government, Fortune 500)
and your DA is below 30, consider targeting longer-tail variants instead.

## Examples

### Example 1: Keyword cluster output format

\`\`\`markdown
## Cluster: API Rate Limiting

Primary keyword: "api rate limiting" (vol: 4,800, KD: 32)
Intent: Informational
Parent topic: API rate limiting

Supporting keywords:
- "api rate limiting best practices" (vol: 1,200, KD: 25)
- "rate limiting algorithms" (vol: 2,100, KD: 38)
- "token bucket vs sliding window" (vol: 880, KD: 19)
- "how to implement rate limiting" (vol: 1,500, KD: 28)
- "rate limiting in node.js" (vol: 720, KD: 15)

Content type: Comprehensive guide (3,000-4,000 words)
SERP features: Featured snippet (paragraph), PAA (5 questions)
Priority score: 78/100
\`\`\`

### Example 2: Content gap analysis output

\`\`\`markdown
## Content Gap: You vs. Competitor A, B, C

| Keyword | Vol | KD | Comp A | Comp B | Comp C | You |
|---------|-----|----|---------|---------|---------|----|
| "webhook security" | 3,200 | 28 | #4 | #7 | #12 | — |
| "api versioning strategies" | 2,800 | 35 | #2 | — | #8 | — |
| "graphql vs rest 2025" | 5,100 | 42 | #1 | #5 | #3 | — |

Opportunity: 3 high-value keywords where 2+ competitors rank but you do not.
Recommended action: Create dedicated pages for each, starting with "webhook security" (lowest KD).
\`\`\`

## Decision tree

- No existing keyword data → start with seed brainstorm and Ahrefs Keywords Explorer
- Have seed keywords → expand with matching terms, related terms, and questions
- Know competitors → run content gap analysis before keyword expansion
- Have a keyword list → cluster by parent topic and intent before prioritizing
- Clusters are ready → score with the priority formula and validate against SERP
- High KD across the board → shift focus to long-tail keywords (KD < 20)
- Low domain authority (DA < 20) → target long-tail, informational queries first

## Edge cases and gotchas

1. **Search volume inflation** — Ahrefs and Semrush volumes are estimates that can differ by 2-3x. Use them for relative comparison, not absolute prediction.
2. **Keyword cannibalization** — two pages targeting the same keyword cluster will compete against each other. Map one primary page per cluster.
3. **Zero-volume keywords** — keywords with "0" volume in tools may still drive traffic. If the intent is clear and specific, they can be valuable long-tail targets.
4. **Seasonal keywords** — some keywords spike seasonally (e.g., "tax software" in Q1). Check the trend graph before committing year-round resources.
5. **SERP intent mismatch** — a keyword may look transactional but the SERP shows only informational results (or vice versa). Always check the actual SERP.
6. **Competitor domain authority gap** — if top results are all DA 80+ and you are DA 20, even a perfect page may not rank. Choose winnable battles.

## Evaluation criteria

- [ ] Seed keyword list covers product terms, problem terms, and audience terms
- [ ] Content gap analysis is run against at least 3 competitors
- [ ] Keyword clusters are mapped to search intent (informational, commercial, etc.)
- [ ] Priority scoring formula is applied consistently to all clusters
- [ ] SERP validation confirms content type alignment for top clusters
- [ ] No keyword cannibalization — one primary page per cluster
- [ ] Long-tail alternatives identified for high-KD primary keywords
- [ ] Output includes specific volume, KD, and traffic potential per keyword`,
    agentDocs: {
      codex: `# Codex — Ahrefs Keyword Research

## Environment
- Codex runs sandboxed: file I/O and shell only, no browser
- Cannot access Ahrefs or Semrush directly — work with exported data files
- Working directory is the project root; data files may be in a data/ or docs/ directory

## Directives
- Process exported keyword CSV or JSON data from Ahrefs/Semrush
- Generate keyword cluster documents as structured markdown files
- Apply the priority scoring formula consistently across all clusters
- Create content gap analysis reports from competitor data
- Output content briefs as markdown files in a docs/ or content/ directory

## Tool usage
- Read CSV/JSON exports to parse keyword data
- Use shell for sorting and filtering large keyword lists
- Write structured markdown reports for each keyword cluster
- Create summary tables with priority scores

## Testing expectations
- Verify keyword data is parsed correctly by spot-checking 5 entries
- Confirm no duplicate keywords across clusters (cannibalization check)
- Validate priority scores sum correctly against the formula
- Check that all output files are valid markdown

## Common failure modes
- CSV parsing errors from special characters in keywords: handle encoding
- Duplicate keywords in multiple clusters: flag and resolve
- Missing volume data for some keywords: default to 0 and flag
- Priority formula weighting not summing to 1.0: validate weights

## Output format
- One markdown file per keyword cluster with full metadata
- Summary table of all clusters ranked by priority score
- Content gap report with competitor ranking data
- List of cannibalization risks if any detected`,

      cursor: `# Cursor — Ahrefs Keyword Research

## IDE context
- Full project access for creating and editing content planning files
- Terminal available for processing exported data
- Search useful for finding existing content that may overlap with new keyword targets

## Code generation rules
- Generate keyword cluster documents as markdown files in docs/seo/
- Include metadata headers with volume, KD, intent, and priority score
- Use markdown tables for keyword lists and competitor comparisons
- Create a summary index file linking to all cluster documents
- Follow existing documentation patterns in the project

## Code style
- Use consistent table column ordering: keyword, volume, KD, intent, notes
- Include temporal context (data export date) in every report header
- Keep cluster documents focused: one cluster per file
- Use relative links between cluster documents and the summary index

## Features to leverage
- Search for existing content files to identify cannibalization with new keyword targets
- Multi-file create for generating multiple cluster documents at once
- Terminal for processing CSV exports if data manipulation is needed
- Linter for validating markdown formatting

## Review checklist
- [ ] Every cluster document has a primary keyword, intent, volume, and KD
- [ ] Priority scores are calculated consistently using the defined formula
- [ ] No two cluster documents target the same primary keyword
- [ ] Content gap analysis includes at least 3 competitors
- [ ] SERP features are noted for each primary keyword`,

      claude: `# Claude — Ahrefs Keyword Research

## Interaction patterns
- When the user asks about keyword research, determine their tool access (Ahrefs, Semrush, both)
- Ask about target market/language before proceeding — volume data varies by country
- If the user provides raw keyword data, cluster and prioritize before suggesting content
- Distinguish between keyword research (this skill) and content optimization (seo-geo skill)

## Response structure
1. **Scope definition** — target market, competitors, and business context
2. **Keyword expansion** — seed → expanded list with tool-specific instructions
3. **Clustering** — grouped by parent topic and intent
4. **Prioritization** — scored and ranked with rationale
5. **Content mapping** — what to write and in what order

## Chain-of-thought guidance
- Consider the user's domain authority before recommending high-KD keywords
- Think about intent overlap between keywords — some should be on the same page
- Evaluate whether the user has existing content that could be optimized instead of new pages
- Factor in business value — not all high-volume keywords drive conversions

## Output formatting
- Use tables for keyword lists with volume, KD, and intent columns
- Use the priority scoring formula explicitly for transparency
- Provide markdown-formatted cluster documents the user can save directly
- Include Ahrefs/Semrush navigation instructions for data export

## Constraints
- Never fabricate search volume or KD numbers — use tool data or clearly state estimates
- Do not recommend targeting keywords without SERP validation guidance
- Warn when the user's domain authority creates an unrealistic gap
- Always include long-tail alternatives alongside primary keyword recommendations`,

      agents: `# AGENTS.md — Ahrefs Keyword Research

## Purpose
Build intent-mapped keyword clusters from Ahrefs and Semrush data, prioritize
by volume/difficulty/business value, and identify content gaps for SEO strategy.

## Review checklist
1. Seed keywords cover product, problem, and audience dimensions
2. Keywords are expanded via matching terms, related terms, and questions
3. Content gap analysis covers at least 3 competitors
4. Clusters are mapped to search intent (informational, navigational, commercial, transactional)
5. Priority scoring formula is applied consistently
6. SERP validation is documented for top-priority clusters
7. No keyword cannibalization between clusters

## Quality gates
- Every cluster has a primary keyword, volume, KD, intent, and priority score
- Long-tail alternatives exist for all clusters with KD > 50
- Content gap report identifies at least 5 opportunity keywords
- No duplicate primary keywords across clusters

## Related skills
- seo-geo: on-page implementation of keyword targeting
- content-seo-strategy: topic cluster architecture that uses keyword data
- ai-citability: AI search optimization that complements keyword-driven SEO

## Escalation criteria
- Escalate when all target keywords have KD > 60 and domain authority is below 30
- Escalate when keyword data is inconsistent between Ahrefs and Semrush
- Escalate when the user's niche has no meaningful search volume`
    }
  },

  // -------------------------------------------------------------------------
  // 6. Google Content SEO Strategy
  // -------------------------------------------------------------------------
  {
    slug: "content-seo-strategy",
    title: "Google Content SEO Strategy",
    description:
      "Topic clusters for Google, content calendars, pillar-page architecture, internal linking strategy, and content lifecycle management for organic growth.",
    category: "seo-geo",
    accent: "signal-blue",
    tags: ["content-strategy", "topic-clusters", "pillar-pages", "internal-linking"],
    body: `# Google Content SEO Strategy

Build a content engine that drives sustained organic growth through topic
clusters, pillar-page architecture, strategic internal linking, content
calendars, and lifecycle management (creation → optimization → refresh → pruning).

## When to use

- Planning a new content program for organic search growth
- Organizing existing content into topic clusters and pillar pages
- Building or auditing an internal linking strategy
- Creating a content calendar aligned with keyword research
- Deciding which content to refresh, consolidate, or prune
- Transitioning from ad-hoc blogging to a systematic content strategy

## When NOT to use

- You need keyword data first — use **keyword-research** before this skill
- Implementing on-page SEO for a specific page — use **seo-geo**
- Technical SEO issues are blocking indexing — fix those first with **technical-seo-audit**
- Content is purely for AI search — use **ai-citability** for GEO-specific optimization

## Core concepts

| Concept | Description |
|---------|-------------|
| Topic cluster | A group of related pages linked to a central pillar page |
| Pillar page | A comprehensive page covering a broad topic that links to all cluster pages |
| Cluster page | A focused page covering a subtopic that links back to the pillar |
| Internal linking | Hyperlinks between pages on the same domain that distribute authority |
| Content brief | A planning document specifying target keyword, intent, outline, and requirements |
| Content lifecycle | Creation → publish → optimize → refresh → prune/consolidate |
| Topical authority | Google's assessment of your site's expertise on a topic, built through cluster coverage |
| Content decay | Gradual decline in organic traffic for aging content |

## Workflow

### Step 1: Define topic clusters from keyword research

Use keyword clusters from the **keyword-research** skill as the foundation:

\`\`\`text
Topic Cluster: API Security
├── Pillar: "Complete Guide to API Security" (primary: "api security", vol: 8,200)
├── Cluster: "API Authentication Methods" (primary: "api authentication", vol: 3,400)
├── Cluster: "OAuth 2.0 Implementation" (primary: "oauth 2.0 tutorial", vol: 2,800)
├── Cluster: "API Rate Limiting" (primary: "api rate limiting", vol: 4,800)
├── Cluster: "JWT Security Best Practices" (primary: "jwt security", vol: 2,100)
└── Cluster: "API Key Management" (primary: "api key management", vol: 1,600)
\`\`\`

### Step 2: Create the pillar page structure

A pillar page should:

- Cover the broad topic comprehensively (2,500-5,000 words)
- Include an overview of every subtopic (cluster page)
- Link to each cluster page with descriptive anchor text
- Serve as a table-of-contents style entry point for the topic
- Target the highest-volume keyword in the cluster

\`\`\`markdown
# Complete Guide to API Security

## Introduction
[Overview of why API security matters — 200-300 words]

## Authentication Methods
[Summary of authentication approaches — 300-400 words]
→ Read more: [API Authentication Methods Deep Dive](/blog/api-authentication)

## OAuth 2.0
[OAuth overview with key concepts — 300-400 words]
→ Read more: [OAuth 2.0 Implementation Guide](/blog/oauth-tutorial)

## Rate Limiting
[Rate limiting overview — 300-400 words]
→ Read more: [API Rate Limiting Best Practices](/blog/api-rate-limiting)

[Continue for each cluster page...]
\`\`\`

### Step 3: Build a content brief template

For each cluster page, create a brief:

\`\`\`markdown
## Content Brief: API Rate Limiting

**Primary keyword:** api rate limiting (vol: 4,800, KD: 32)
**Secondary keywords:** rate limiting best practices, token bucket algorithm
**Intent:** Informational
**Target length:** 2,500-3,500 words
**Content type:** Comprehensive guide

### Required sections
1. What is API rate limiting? (definition + why it matters)
2. Common algorithms (token bucket, sliding window, fixed window)
3. Implementation examples (Node.js, Python, Go)
4. Best practices (headers, error responses, documentation)
5. Monitoring and alerting

### Internal links required
- Link TO pillar: "Complete Guide to API Security"
- Link TO sibling: "API Authentication Methods"
- Link FROM pillar: Ensure pillar links to this page

### SERP analysis
- Top 3 average word count: 2,800
- Featured snippet: yes (paragraph, "what is rate limiting")
- PAA questions: 5 relevant questions to address
\`\`\`

### Step 4: Implement internal linking

Follow these rules for internal linking:

| Link type | Rule |
|-----------|------|
| Pillar → Cluster | Every pillar links to all its cluster pages |
| Cluster → Pillar | Every cluster page links back to its pillar |
| Cluster → Cluster | Related cluster pages cross-link where natural |
| Anchor text | Use descriptive, keyword-relevant text — not "click here" |
| Link placement | Place links in the body content, not just footer or sidebar |
| Link count | 3-10 internal links per page; more for longer content |

### Step 5: Create a content calendar

Map cluster pages to a production schedule:

\`\`\`markdown
## Q2 2025 Content Calendar

### Month 1 (April)
- Week 1: Publish pillar "Complete Guide to API Security"
- Week 2: Publish "API Authentication Methods"
- Week 3: Publish "OAuth 2.0 Implementation Guide"
- Week 4: Refresh pillar with links to new cluster pages

### Month 2 (May)
- Week 1: Publish "API Rate Limiting Best Practices"
- Week 2: Publish "JWT Security Best Practices"
- Week 3: Publish "API Key Management"
- Week 4: Full internal linking audit + pillar refresh

### Month 3 (June)
- Week 1-2: Performance review — traffic, rankings, CTR
- Week 3: Optimize underperforming cluster pages
- Week 4: Plan Q3 cluster expansion
\`\`\`

### Step 6: Content refresh triggers

Monitor content and refresh when these criteria are met:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Traffic decay | > 20% decline over 60 days | Refresh with updated data and examples |
| Ranking drop | Dropped below position 10 | Re-optimize for target keyword + add fresh sections |
| Stale data | Statistics older than 12 months | Update numbers and add current-year references |
| Competitor update | Competitor publishes competing page | Analyze and match or exceed their coverage |
| New subtopic | New cluster page published | Add a link from the pillar page |
| Thin content | Page under 800 words | Expand or consolidate with a related page |

## Examples

### Example 1: Internal linking audit script concept

\`\`\`typescript
// Pseudocode for an internal linking audit
type LinkAudit = {
  page: string;
  internalLinksOut: string[];
  internalLinksIn: string[];
  pillarLinked: boolean;
  orphan: boolean;
};

function auditInternalLinks(pages: PageData[]): LinkAudit[] {
  return pages.map((page) => {
    const linksOut = extractInternalLinks(page.body);
    const linksIn = pages.filter((p) =>
      extractInternalLinks(p.body).includes(page.url)
    ).map((p) => p.url);

    return {
      page: page.url,
      internalLinksOut: linksOut,
      internalLinksIn: linksIn,
      pillarLinked: linksOut.some((l) => isPillarPage(l)),
      orphan: linksIn.length === 0,
    };
  });
}
\`\`\`

### Example 2: Content decay detection

\`\`\`markdown
## Content Decay Report — March 2025

| Page | Peak traffic | Current traffic | Decline | Action |
|------|-------------|----------------|---------|--------|
| /blog/api-auth | 3,200/mo | 1,800/mo | -44% | Refresh: update OAuth examples |
| /blog/jwt-guide | 2,100/mo | 1,900/mo | -10% | Monitor: within normal range |
| /blog/graphql-intro | 4,500/mo | 2,000/mo | -56% | Major refresh or consolidate |
\`\`\`

## Decision tree

- No content strategy exists → start with keyword research, then build topic clusters
- Keyword clusters ready → map to topic clusters and create pillar page outlines
- Pillar pages exist → create content briefs for cluster pages
- Cluster pages published → audit and fix internal linking
- Traffic declining → run content decay analysis and refresh triggers
- Too many small pages on similar topics → consolidate into fewer, stronger pages
- New competitor content appearing → analyze their coverage and match or exceed it
- Content calendar is empty → fill with cluster pages ordered by priority score

## Edge cases and gotchas

1. **Pillar page too broad** — a pillar that tries to cover an entire industry will be too thin on each subtopic. Keep pillar topics scoped to one product category or problem domain.
2. **Over-linking** — more than 10-15 internal links on a short page dilutes their value and looks spammy. Limit links to genuinely helpful cross-references.
3. **Orphan pages** — pages with zero internal links pointing to them are effectively invisible to Google. Run regular audits to find and link orphan pages.
4. **Cannibalization** — if two cluster pages target the same keyword, they compete with each other. Consolidate or differentiate them clearly.
5. **Stale calendars** — a content calendar that is not maintained becomes fiction. Review and update monthly, not just at the start of a quarter.
6. **Refresh without re-optimization** — updating content without re-checking keyword targeting, internal links, and schema markup wastes the effort. Treat refreshes as a full optimization pass.

## Evaluation criteria

- [ ] Every keyword cluster is mapped to a topic cluster with a pillar page
- [ ] Pillar pages link to all their cluster pages with descriptive anchor text
- [ ] Every cluster page links back to its pillar page
- [ ] No orphan pages (every page has at least one internal link pointing to it)
- [ ] Content briefs exist for all planned cluster pages
- [ ] Content calendar is populated for the next quarter
- [ ] Refresh triggers are defined and monitored monthly
- [ ] No keyword cannibalization between cluster pages`,
    agentDocs: {
      codex: `# Codex — Google Content SEO Strategy

## Environment
- Codex runs sandboxed: file I/O and shell only, no browser or GUI
- Cannot access Google Search Console or analytics — work with exported data
- Working directory is the project root; content files may be in docs/, blog/, or content/

## Directives
- Generate topic cluster maps as structured markdown files
- Create content brief templates for each cluster page
- Build content calendar documents with quarterly schedules
- Audit existing content files for internal linking completeness
- Produce internal linking reports identifying orphan pages

## Tool usage
- Read content/blog files to extract existing internal links
- Use grep to find pages that lack internal links or pillar connections
- Write content briefs, cluster maps, and calendar files as markdown
- Use shell for counting links per page and identifying orphans
- Read keyword data files to map clusters to content plans

## Testing expectations
- Verify cluster maps have no duplicate primary keywords
- Check that pillar page outlines link to all planned cluster pages
- Validate content briefs have all required sections
- Confirm no orphan pages exist after linking audit

## Common failure modes
- Cluster pages without a pillar parent: ensure every cluster has a pillar assignment
- Internal links using absolute localhost URLs: always use relative paths
- Content calendar with dates in the past: verify calendar is current
- Briefs missing SERP analysis section: include for every brief

## Output format
- Topic cluster map as an indented markdown tree
- One content brief per cluster page as a separate markdown file
- Content calendar as a quarterly markdown document
- Internal linking audit report with orphan page list`,

      cursor: `# Cursor — Google Content SEO Strategy

## IDE context
- Full project access for creating and editing content planning documents
- Search useful for finding existing content that overlaps with planned clusters
- Terminal available for processing content files and counting internal links

## Code generation rules
- Create content planning files in docs/seo/ or docs/content-strategy/
- Use consistent markdown formatting for briefs, calendars, and cluster maps
- Include metadata (dates, keyword data, priority scores) in document headers
- Generate linking audit scripts as TypeScript utilities in lib/seo/
- Follow existing documentation patterns in the project

## Code style
- Use markdown trees (indented lists with ├── and └──) for cluster visualization
- Include ISO dates in calendar entries and document headers
- Keep content briefs to one page — use sections, not sprawling paragraphs
- Use tables for data-heavy outputs (calendars, audit results, keyword lists)

## Features to leverage
- Search for all markdown/MDX content files to audit for internal links
- Multi-file create for generating briefs for an entire cluster at once
- Terminal for running link audit scripts
- Grep for finding orphan pages and missing internal links

## Review checklist
- [ ] Every topic cluster has a pillar page and at least 3 cluster pages
- [ ] Content briefs include target keyword, intent, required sections, and internal links
- [ ] Content calendar covers at least one full quarter
- [ ] No two briefs target the same primary keyword
- [ ] Internal linking rules are documented and applied consistently`,

      claude: `# Claude — Google Content SEO Strategy

## Interaction patterns
- When the user asks about content strategy, determine what assets exist already
- Ask about keyword research status — this skill depends on keyword data
- If the user has existing content, start with an audit before planning new content
- Structure responses as strategic plans with actionable next steps

## Response structure
1. **Current state assessment** — what content exists and how it is organized
2. **Topic cluster proposal** — clusters mapped from keyword data
3. **Pillar page outlines** — structure for each pillar page
4. **Content calendar** — phased production schedule
5. **Measurement plan** — how to track content performance

## Chain-of-thought guidance
- Validate that keyword research is complete before building clusters
- Consider the user's production capacity when planning the calendar
- Think about content quality vs. quantity — fewer excellent pages beat many thin ones
- Evaluate existing content for consolidation before planning new pages

## Output formatting
- Use tree diagrams for topic cluster visualization
- Use tables for content calendars and audit results
- Provide ready-to-use content brief templates in markdown
- Include internal linking maps showing required connections

## Constraints
- Do not plan content without keyword data — recommend keyword-research skill first
- Never suggest publishing thin content (under 800 words) as standalone pages
- Warn when the content calendar is unrealistic for the user's team size
- Always include refresh and maintenance in the content lifecycle plan`,

      agents: `# AGENTS.md — Google Content SEO Strategy

## Purpose
Plan and manage a topic-cluster content program: pillar pages, cluster pages,
internal linking, content calendars, and lifecycle management for organic growth.

## Review checklist
1. Topic clusters are derived from validated keyword research data
2. Every cluster has a pillar page targeting the highest-volume keyword
3. Content briefs exist for all planned cluster pages with required sections
4. Internal linking rules are defined (pillar ↔ cluster, cross-cluster)
5. Content calendar covers at least one quarter with specific dates
6. Refresh triggers are defined with measurable thresholds
7. No keyword cannibalization between cluster pages or pillars

## Quality gates
- Every page in a cluster links to its pillar (and vice versa)
- No orphan pages exist in the content inventory
- Content briefs include target keyword, intent, SERP analysis, and internal links
- Calendar production rate matches the team's actual capacity

## Related skills
- keyword-research: provides the keyword data this skill depends on
- seo-geo: on-page optimization for individual pages within clusters
- ai-citability: GEO signals to layer onto cluster content
- technical-seo-audit: ensures content is crawlable and indexable

## Escalation criteria
- Escalate when content production capacity cannot meet the calendar
- Escalate when significant content consolidation requires editorial judgment
- Escalate when topical authority is not improving after 2 quarters of publication`
    }
  }
];
