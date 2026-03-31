import type { CreateSkillInput } from "@/lib/db/skills";

type SeedSkill = Omit<CreateSkillInput, "origin"> & {
  origin?: CreateSkillInput["origin"];
};

export const ops: SeedSkill[] = [
  {
    slug: "gh-actions-ci",
    title: "GitHub Actions CI",
    description:
      "CI/CD workflows with GitHub Actions: test pipelines, build caching, deployment automation, matrix builds, and reusable workflows.",
    category: "ops",
    accent: "signal-gold",
    tags: ["ci", "github-actions", "automation", "deployment", "testing"],
    body: `# GitHub Actions CI

Automate testing, building, and deploying with GitHub Actions for pnpm/Next.js projects and beyond.

## When to use

- Every repo with tests, linting, or type-checking that needs automated quality gates
- Projects deploying to Vercel, AWS, or any cloud provider
- Monorepos needing coordinated build/test across packages
- Libraries publishing to npm or GitHub Packages

## When NOT to use

- Tiny scripts with no tests or deployment target
- Repos locked into another CI provider where migration cost exceeds benefit
- Builds requiring hardware GitHub-hosted runners cannot provide (use self-hosted instead)

## Core concepts

A workflow is a YAML file in \`.github/workflows/\` composed of triggers (\`on\`), jobs (parallel VMs), steps (sequential commands), and actions (reusable units). Caching restores files between runs using keys derived from lockfile hashes — cache hits skip expensive install/build steps.

| Primitive | Purpose |
|-----------|---------|
| \`on.push\` / \`on.pull_request\` | Trigger on code changes |
| \`on.workflow_dispatch\` | Manual trigger with inputs |
| \`on.schedule\` | Cron-based trigger |
| \`jobs.<id>.strategy.matrix\` | Fan out across Node versions/OSes |
| \`jobs.<id>.environment\` | Gate deploys with approval |
| \`uses: ./.github/workflows/ci.yml\` | Reusable workflow |

## Workflow

### Step 1 — Complete CI + build + deploy pipeline

\`\`\`yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true
permissions: { contents: read }

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b34f77f8bc703a5f83169411f1f62a0633a0
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm tsc --noEmit
      - run: pnpm test -- --coverage

  build:
    needs: quality
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b34f77f8bc703a5f83169411f1f62a0633a0
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - uses: actions/cache@5a3ec84eff668545956fd18022155c47e93e2684
        with:
          path: .next/cache
          key: nextjs-\${{ runner.os }}-\${{ hashFiles('pnpm-lock.yaml') }}-\${{ hashFiles('**/*.ts','**/*.tsx') }}
          restore-keys: |
            nextjs-\${{ runner.os }}-\${{ hashFiles('pnpm-lock.yaml') }}-
            nextjs-\${{ runner.os }}-
      - run: pnpm build

  deploy-preview:
    needs: build
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    environment: { name: preview, url: "\${{ steps.d.outputs.url }}" }
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - id: d
        run: |
          URL=$(npx vercel deploy --token=\${{ secrets.VERCEL_TOKEN }})
          echo "url=\$URL" >> "\$GITHUB_OUTPUT"

  deploy-prod:
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: { name: production, url: "https://example.com" }
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - run: npx vercel deploy --prod --token=\${{ secrets.VERCEL_TOKEN }}
\`\`\`

### Step 2 — Reusable workflow pattern

\`\`\`yaml
# .github/workflows/reusable-ci.yml
name: Reusable CI
on:
  workflow_call:
    inputs:
      node-version: { type: string, default: "20" }
      run-e2e: { type: boolean, default: false }
    secrets:
      VERCEL_TOKEN: { required: false }
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b34f77f8bc703a5f83169411f1f62a0633a0
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: "\${{ inputs.node-version }}", cache: pnpm }
      - run: pnpm install --frozen-lockfile && pnpm lint && pnpm tsc --noEmit && pnpm test
      - if: inputs.run-e2e
        run: pnpm test:e2e
\`\`\`

Consume: \`uses: ./.github/workflows/reusable-ci.yml\` with \`with: { node-version: "20", run-e2e: true }\`.

## Examples

### Example 1 — Matrix builds across Node versions

\`\`\`yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix: { node: [18, 20, 22] }
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b34f77f8bc703a5f83169411f1f62a0633a0
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: "\${{ matrix.node }}", cache: pnpm }
      - run: pnpm install --frozen-lockfile && pnpm test
\`\`\`

### Example 2 — Monorepo with path filters

\`\`\`yaml
on:
  pull_request:
    paths: ["packages/api/**", "packages/web/**", "pnpm-lock.yaml"]
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      api: \${{ steps.f.outputs.api }}
      web: \${{ steps.f.outputs.web }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: dorny/paths-filter@de90cc6fb38fc0963ad72b210f1f284cd68cea36
        id: f
        with:
          filters: |
            api: ["packages/api/**"]
            web: ["packages/web/**"]
  test-api:
    needs: changes
    if: needs.changes.outputs.api == 'true'
    uses: ./.github/workflows/reusable-ci.yml
  test-web:
    needs: changes
    if: needs.changes.outputs.web == 'true'
    uses: ./.github/workflows/reusable-ci.yml
\`\`\`

### Example 3 — Scheduled security audit

\`\`\`yaml
name: Security Audit
on:
  schedule: [{ cron: "0 9 * * 1" }]
  workflow_dispatch:
jobs:
  audit:
    runs-on: ubuntu-latest
    permissions: { issues: write }
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b34f77f8bc703a5f83169411f1f62a0633a0
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=high 2>&1 | tee audit.txt
        continue-on-error: true
      - if: failure()
        uses: peter-evans/create-issue-from-file@e8ef132d6df98ed982188e460ebb3b5d4ef3a9cd
        with: { title: "Security: audit found vulnerabilities", content-filepath: audit.txt, labels: "security,automated" }
\`\`\`

## Decision tree

1. **Have tests?** → Yes: CI workflow. No: lint + type-check only.
2. **Monorepo?** → Yes: path filters + \`--filter\`. No: single job.
3. **Multiple Node versions?** → Yes: matrix. No: pin to LTS.
4. **Deploying from CI?** → Yes: environments with secrets. No: skip deploy jobs.
5. **Shared CI across repos?** → Yes: reusable workflow. No: keep local.
6. **Long builds?** → Yes: cache \`.next/cache\` + turbo remote cache. No: default cache.
7. **Security-sensitive?** → Yes: SHA-pinned actions, restricted perms, scheduled audit.

## Edge cases and gotchas

- **Cache thrashing** — overly specific keys miss every run; layer with \`restore-keys\`
- **Concurrency races** — without \`concurrency\` groups, pushes to the same PR queue redundant runs
- **Fork secret exposure** — \`pull_request\` from forks cannot access secrets; \`pull_request_target\` has write access on the base — use with caution
- **Action supply-chain** — \`@v4\` tags can be moved; pin to full SHA hashes
- **Timeout waste** — default 360-min timeout burns runner minutes on hung jobs
- **pnpm store path** — differs on self-hosted runners, breaking cache restore

## Evaluation criteria

| Criterion | Pass | Fail |
|-----------|------|------|
| Tests on every PR | Triggers on \`pull_request\` | Only on \`push\` to main |
| Deps cached | \`setup-node\` cache or \`actions/cache\` | Fresh install every run |
| Actions SHA-pinned | Full commit hash | Version tag (\`@v4\`) |
| Explicit permissions | \`permissions: contents: read\` | Missing (defaults write-all) |
| Job timeout set | \`timeout-minutes\` on every job | 360-min default |
| Concurrency group | \`cancel-in-progress: true\` | Redundant runs stack |`,
    agentDocs: {
      codex: `# Codex — GitHub Actions CI

## Context
You are operating in a terminal environment with full filesystem and git access.
Workflow files live in \`.github/workflows/\` and composite actions in \`.github/actions/\`.

## When this skill applies
- User asks to set up CI, add tests to CI, fix a failing workflow, or optimize build times
- User is creating a new repository and needs a CI pipeline
- User asks about caching, matrix builds, or deployment automation

## Implementation rules
- Always use \`pnpm/action-setup\` for pnpm projects — never install pnpm manually
- Pin every action to a full SHA hash, not a version tag
- Set \`permissions: contents: read\` at the workflow level; add write permissions only on specific jobs
- Set \`timeout-minutes\` on every job — never rely on the 360-minute default
- Add \`concurrency\` groups with \`cancel-in-progress: true\` on PR workflows
- Cache \`.next/cache\` for Next.js builds using a layered key strategy
- Run lint and type-check before tests (fail fast)

## File organization
- One workflow per concern: \`ci.yml\`, \`deploy.yml\`, \`audit.yml\`
- Extract repeated setup steps into composite actions under \`.github/actions/\`
- Use reusable workflows for patterns shared across repositories

## Debugging workflows
- Use \`act\` for local testing of simple workflows
- Add \`workflow_dispatch\` trigger to any workflow for manual re-runs
- Use \`continue-on-error: true\` only for non-blocking audit steps, never for tests

## Security checklist
- Never echo secrets or use them in \`run\` steps that log output
- Restrict \`pull_request_target\` usage — it grants write access
- Audit third-party actions before adding them to workflows
- Use \`GITHUB_TOKEN\` with minimum required permissions`,
      cursor: `# Cursor — GitHub Actions CI

## IDE context
Workflow files are YAML in \`.github/workflows/\`. Cursor provides YAML validation and schema support when the GitHub Actions extension is installed.

## When this skill applies
- Editing or creating files in \`.github/workflows/\` or \`.github/actions/\`
- User asks to add CI, fix a workflow, or optimize build caching
- Reviewing pull requests that modify CI configuration

## Code patterns
- Use \`pnpm/action-setup\` + \`actions/setup-node\` with \`cache: pnpm\` for pnpm projects
- Always set \`--frozen-lockfile\` on \`pnpm install\` in CI
- Use \`hashFiles('pnpm-lock.yaml')\` for cache key generation
- Prefer composite actions over copy-pasting setup steps across workflows

## Cursor features to leverage
- Multi-file edit when updating action versions across all workflows
- Search for action SHA hashes to verify pinning across the repo
- Terminal for running \`act\` to test workflows locally
- Linter output for YAML syntax issues

## Review checklist
- [ ] Are all actions pinned to SHA hashes?
- [ ] Is \`permissions\` set explicitly at workflow level?
- [ ] Is \`timeout-minutes\` set on every job?
- [ ] Is \`concurrency\` configured for PR workflows?
- [ ] Are secrets only accessible in jobs that need them?
- [ ] Is \`--frozen-lockfile\` used for dependency installation?
- [ ] Are cache keys using \`hashFiles\` for proper invalidation?
- [ ] Is the workflow tested with \`workflow_dispatch\` trigger?`,
      claude: `# Claude — GitHub Actions CI

## Interaction patterns
- When the user asks about CI, first assess their project type (pnpm/npm/yarn, Next.js/Vite/Node, monorepo/single-repo)
- Ask which deployment target they use before generating deploy jobs
- Structure response: current state assessment → workflow plan → implementation

## Response structure
1. **Assessment** — identify the project's package manager, framework, and deployment target
2. **Workflow design** — outline jobs, dependencies, and caching strategy
3. **Implementation** — provide complete YAML files with SHA-pinned actions
4. **Verification** — explain how to test the workflow locally with \`act\` or via \`workflow_dispatch\`

## Chain-of-thought guidance
- Consider whether the project is a monorepo before suggesting a single CI file
- Think about cache invalidation: lockfile hash for dependencies, source hash for build cache
- Evaluate security posture: are there secrets? Is this a public repo accepting fork PRs?
- Check if the user needs matrix builds (multiple Node versions, OS targets)

## Output formatting
- Use YAML code blocks with complete, runnable workflow files
- Comment non-obvious steps (why a specific cache key pattern, why SHA pinning)
- When modifying existing workflows, show the diff or the specific section to change
- Include the file path as a comment at the top of each YAML block

## Constraints
- Never suggest \`@v4\` style tags — always use full SHA hashes
- Never add \`pull_request_target\` without explaining the security implications
- Never suggest \`actions/cache\` when \`setup-node\` cache option covers the use case
- Always set explicit \`permissions\` — never rely on defaults`,
      agents: `# AGENTS.md — GitHub Actions CI

## Purpose
Ensure CI workflows are secure, fast, and correctly configured for the project's stack.

## Review checklist
1. Are all GitHub Actions pinned to full SHA hashes (not version tags)?
2. Is \`permissions\` explicitly set at the workflow level with minimum required access?
3. Is \`timeout-minutes\` set on every job (not relying on 360-minute default)?
4. Is \`concurrency\` configured with \`cancel-in-progress: true\` for PR workflows?
5. Are dependencies cached via \`setup-node\` cache or explicit \`actions/cache\`?
6. Is \`--frozen-lockfile\` used for all dependency installations?
7. Are secrets scoped to only the jobs/environments that need them?
8. Is \`pull_request_target\` avoided or used with documented security justification?
9. Are build outputs (\`.next/cache\`) cached with layered restore keys?
10. Is there a scheduled security audit workflow for dependency vulnerabilities?

## Quality gates
- CI must pass before any PR can merge (branch protection rule)
- Coverage must not decrease (upload and compare artifacts)
- No workflow should run longer than 15 minutes without justification
- All workflows must have \`workflow_dispatch\` for manual debugging

## Failure protocol
- If a workflow fails on a PR, the author is responsible for fixing it before merge
- If a scheduled audit finds vulnerabilities, create an issue automatically
- If a deploy fails, roll back automatically or alert via Slack/email

## Anti-patterns to flag
- Installing dependencies without cache
- Using \`@main\` or \`@latest\` for action versions
- Missing \`permissions\` block (defaults to dangerous write-all)
- Running all tests on push AND pull_request (duplicate work)
- Storing secrets in workflow files instead of GitHub Secrets`
    }
  },
  {
    slug: "release-management",
    title: "GitHub Release Management",
    description:
      "GitHub Releases, semantic versioning, changelogs, release automation, Vercel feature flags, canary deployments, and rollback strategies.",
    category: "ops",
    accent: "signal-gold",
    tags: ["releases", "versioning", "changelog", "deployment", "feature-flags"],
    body: `# GitHub Release Management

Ship confidently with structured versioning, automated changelogs, feature flags, and safe deployment strategies.

## When to use

- Any project shipping to users that needs traceable versions
- Teams coordinating releases across multiple contributors
- Products requiring gradual rollout or instant rollback capability
- Libraries publishing to npm or any package registry

## When NOT to use

- Internal tools where version tracking adds no value
- Prototypes where velocity matters more than traceability
- Single-developer projects where git tags and manual notes suffice
- Continuous-deploy pipelines where every merge is implicitly a release

## Core concepts

### Semantic versioning

| Bump | When | Example |
|------|------|---------|
| **MAJOR** | Breaking API changes | 1.x.x → 2.0.0 |
| **MINOR** | New features, backward-compatible | 1.0.x → 1.1.0 |
| **PATCH** | Bug fixes, backward-compatible | 1.0.0 → 1.0.1 |
| **Pre-release** | Unstable testing versions | 2.0.0-beta.1 |

### Changelog categories (Keep a Changelog)

**Added** · **Changed** · **Deprecated** · **Removed** · **Fixed** · **Security**

### Deployment strategies

| Strategy | Risk | Rollback | Best for |
|----------|------|----------|----------|
| Blue-green | Low | Instant switch | Zero-downtime deploys |
| Canary | Low | Routing change | High-traffic production |
| Feature flags | Lowest | Toggle off | Decouple deploy from release |
| Rolling | Medium | Deploy previous | Stateless services |

## Workflow

### Step 1 — Changesets for version management

\`\`\`bash
pnpm add -D @changesets/cli @changesets/changelog-github
pnpm changeset init
\`\`\`

\`\`\`json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "org/repo" }],
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch"
}
\`\`\`

### Step 2 — Automated releases with release-please

\`\`\`yaml
# .github/workflows/release.yml
name: Release
on: { push: { branches: [main] } }
permissions: { contents: write, pull-requests: write }

jobs:
  release:
    runs-on: ubuntu-latest
    outputs:
      created: \${{ steps.rp.outputs.release_created }}
      tag: \${{ steps.rp.outputs.tag_name }}
    steps:
      - uses: googleapis/release-please-action@7987652d64b4581673a76e33ad5e98e3dd56571f
        id: rp
        with:
          release-type: node
          package-name: my-app

  publish:
    needs: release
    if: needs.release.outputs.created == 'true'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b34f77f8bc703a5f83169411f1f62a0633a0
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: 20, cache: pnpm, registry-url: "https://registry.npmjs.org" }
      - run: pnpm install --frozen-lockfile && pnpm build
      - run: pnpm publish --no-git-checks
        env: { NODE_AUTH_TOKEN: "\${{ secrets.NPM_TOKEN }}" }
\`\`\`

### Step 3 — GitHub Release API via CLI

\`\`\`bash
gh release create v1.2.0 --title "v1.2.0" --notes-file CHANGELOG.md --target main
gh release create v2.0.0-beta.1 --prerelease --notes "Beta for new API"
gh release upload v1.2.0 dist/app.zip dist/checksums.txt
gh release list --limit 10
\`\`\`

### Step 4 — Feature flags with Vercel Edge Config

\`\`\`typescript
import { get } from "@vercel/edge-config";

type FeatureFlags = {
  newDashboard: boolean;
  rolloutPercentage: number;
};

async function getFlags(): Promise<FeatureFlags> {
  return (await get<FeatureFlags>("featureFlags")) ?? {
    newDashboard: false,
    rolloutPercentage: 0,
  };
}

function hashUserId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

async function isEnabled(flag: keyof FeatureFlags, userId?: string): Promise<boolean> {
  const flags = await getFlags();
  const val = flags[flag];
  if (typeof val === "boolean") return val;
  return userId ? hashUserId(userId) % 100 < (val as number) : false;
}
\`\`\`

### Step 5 — Canary deploy with health-check soak

\`\`\`yaml
# .github/workflows/canary.yml
name: Canary Deploy
on: { push: { branches: [canary] } }
jobs:
  canary:
    runs-on: ubuntu-latest
    environment: canary
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b34f77f8bc703a5f83169411f1f62a0633a0
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile && pnpm build
      - run: npx vercel deploy --prod --token=\${{ secrets.VERCEL_TOKEN }} --build-env NEXT_PUBLIC_RELEASE_CHANNEL=canary
      - name: Soak test (5 min)
        run: |
          for i in {1..5}; do
            STATUS=$(curl -so /dev/null -w "%{http_code}" https://canary.example.com/api/health)
            [ "\$STATUS" != "200" ] && echo "Health check failed (\$STATUS)" && exit 1
            echo "Check \$i/5 passed"; sleep 60
          done
      - if: failure()
        name: Auto-rollback
        run: npx vercel rollback --token=\${{ secrets.VERCEL_TOKEN }}
\`\`\`

### Step 6 — Rollback procedures

\`\`\`bash
npx vercel rollback --token=\$VERCEL_TOKEN           # Vercel instant rollback
git revert HEAD --no-edit && git push origin main    # Git-based rollback
gh workflow run deploy.yml -f version=v1.1.9         # Tag-based redeploy
\`\`\`

## Examples

### Example 1 — Conventional commits driving release-please

\`\`\`bash
git commit -m "feat: add user profile page"           # → minor bump
git commit -m "fix: resolve login redirect loop"       # → patch bump
git commit -m "feat!: redesign auth API

BREAKING CHANGE: /auth/login returns session object instead of raw token."
# → major bump
# release-please opens a Release PR with version + CHANGELOG, merging it creates the GitHub Release
\`\`\`

### Example 2 — Edge Config middleware for maintenance mode

\`\`\`typescript
import { createClient } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";

const ec = createClient(process.env.EDGE_CONFIG);

export async function middleware(req: NextRequest) {
  if (await ec.get<boolean>("maintenanceMode")) {
    if (!req.nextUrl.pathname.startsWith("/maintenance"))
      return NextResponse.rewrite(new URL("/maintenance", req.url));
  }
  const beta = await ec.get<string[]>("betaUsers");
  const uid = req.cookies.get("userId")?.value;
  if (req.nextUrl.pathname.startsWith("/beta") && (!uid || !beta?.includes(uid)))
    return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}
\`\`\`

### Example 3 — Release + deploy + Slack notify

\`\`\`yaml
name: Release & Notify
on: { push: { branches: [main] } }
permissions: { contents: write, pull-requests: write }
jobs:
  release:
    runs-on: ubuntu-latest
    outputs:
      created: \${{ steps.rp.outputs.release_created }}
      tag: \${{ steps.rp.outputs.tag_name }}
    steps:
      - uses: googleapis/release-please-action@7987652d64b4581673a76e33ad5e98e3dd56571f
        id: rp
        with: { release-type: node }
  deploy:
    needs: release
    if: needs.release.outputs.created == 'true'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - run: npx vercel deploy --prod --token=\${{ secrets.VERCEL_TOKEN }}
  notify:
    needs: [release, deploy]
    if: needs.release.outputs.created == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: slackapi/slack-github-action@37ebaef184d7626c5f204ab8d3baff4262dd30f0
        with:
          payload: '{"text":"Released \${{ needs.release.outputs.tag }} to production"}'
        env: { SLACK_WEBHOOK_URL: "\${{ secrets.SLACK_WEBHOOK }}", SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK }
\`\`\`

## Decision tree

1. **External consumers?** → Yes: strict semver. No: simplified versioning.
2. **Monorepo?** → Yes: changesets. Single package: release-please.
3. **Publishing to registry?** → Yes: automate publish in release workflow.
4. **Need gradual rollout?** → Yes: feature flags + canary deploys.
5. **Need instant rollback?** → Yes: Vercel rollback or blue-green. No: git revert.
6. **Multiple environments?** → Yes: GitHub environments with approval gates.

## Edge cases and gotchas

- **Changeset merge conflicts** — multiple PRs creating changesets for the same package conflict; resolve by keeping both files (they merge at version time)
- **Tag protection** — restrict tag creation to the release workflow; manual tags desync from changelogs
- **Edge Config propagation** — changes take 50-300ms to propagate globally; health checks may see stale flag values
- **Rollback + migrations** — code rollback does not undo schema changes; use expand-contract pattern for safe migrations
- **Orphaned flags** — flags left enabled after full rollout are invisible tech debt; set owner and expiry on every flag
- **Changelog drift** — manual changelogs diverge within weeks; always automate from commits or changesets

## Evaluation criteria

| Criterion | Pass | Fail |
|-----------|------|------|
| Versioning follows semver | Bumps match change types | Arbitrary versions |
| Changelog automated | From commits/changesets | Manual or missing |
| Releases tagged | Every release has git tag | Tags inconsistent |
| Deploy gated | Environments with approval | Direct push-to-prod |
| Rollback tested | Documented, rehearsed | No rollback plan |
| Flags have owners | Owner + expiry per flag | Orphaned flags |
| Notifications configured | Alert on release + failure | Silent deploys |`,
    agentDocs: {
      codex: `# Codex — GitHub Release Management

## Context
You are operating in a terminal with full filesystem, git, and GitHub CLI access.
Release config lives in \`.changeset/\`, \`.github/workflows/\`, and \`package.json\`.

## When this skill applies
- User asks to set up release automation, versioning, or changelogs
- User needs to create a GitHub Release, tag, or publish a package
- User asks about feature flags, canary deployments, or rollback strategies
- User is migrating from manual releases to automated pipelines

## Implementation rules
- Use conventional commits (\`feat:\`, \`fix:\`, \`feat!:\`) for release-please compatibility
- Use changesets for monorepos, release-please for single packages
- Always pin release action versions to SHA hashes
- Configure \`permissions: contents: write, pull-requests: write\` for release workflows
- Use GitHub environments with approval gates for production deploys
- Include Slack/email notification in the release workflow

## Release commands
- \`pnpm changeset\` — create a changeset for the current change
- \`pnpm changeset version\` — apply changesets and bump versions
- \`pnpm changeset publish\` — publish changed packages to npm
- \`gh release create\` — create a GitHub Release with assets
- \`gh release list\` — audit recent releases

## Rollback procedures
- Vercel: \`npx vercel rollback\` for instant production rollback
- Git: \`git revert HEAD && git push\` for commit-level rollback
- Feature flags: toggle off via Edge Config API for instant disable

## Security checklist
- npm tokens stored as GitHub Secrets, not in workflow files
- Tag creation restricted to release workflows via branch protection
- Release assets include checksums for integrity verification
- Pre-releases clearly marked to avoid accidental production use`,
      cursor: `# Cursor — GitHub Release Management

## IDE context
Release config files: \`.changeset/config.json\`, \`.github/workflows/release.yml\`, \`package.json\` version field.
Changelogs: \`CHANGELOG.md\` at repo root or per-package in monorepos.

## When this skill applies
- Creating or editing release workflows in \`.github/workflows/\`
- Writing changeset files or configuring \`.changeset/config.json\`
- Updating version fields in \`package.json\`
- Implementing feature flag logic in application code
- Reviewing PRs that modify release configuration

## Code patterns
- Use \`@changesets/changelog-github\` for GitHub-linked changelogs
- Use \`googleapis/release-please-action\` for single-package repos
- Import feature flags from \`@vercel/edge-config\` for runtime toggles
- Use \`gh release\` CLI commands in terminal for manual release operations

## Cursor features to leverage
- Multi-file edit when updating version numbers across packages
- Search for \`BREAKING CHANGE\` in recent commits to determine version bump
- Terminal for running \`pnpm changeset\` and \`gh release\` commands
- Git lens for tracking which commits are included in a release

## Review checklist
- [ ] Is the version bump correct for the type of change (major/minor/patch)?
- [ ] Is the changelog entry clear and user-facing?
- [ ] Are release workflow permissions set to minimum required?
- [ ] Is the release action pinned to a SHA hash?
- [ ] Are npm tokens and deploy secrets stored in GitHub Secrets?
- [ ] Does the release workflow include notification (Slack/email)?
- [ ] Are feature flags documented with owner and expected cleanup date?
- [ ] Is the rollback procedure documented and tested?`,
      claude: `# Claude — GitHub Release Management

## Interaction patterns
- When the user asks about releases, first determine: library vs application, monorepo vs single-repo, deployment target
- Ask whether they use conventional commits before suggesting release-please
- Clarify if they need npm publishing, GitHub Releases, or deployment automation (different concerns)

## Response structure
1. **Assessment** — identify release maturity: manual, semi-automated, or fully automated
2. **Tool selection** — recommend changesets vs release-please based on project structure
3. **Implementation** — provide complete workflow files and configuration
4. **Migration path** — if upgrading from manual, give incremental adoption steps

## Chain-of-thought guidance
- Consider team size: solo developers need less ceremony than teams
- Think about consumer impact: libraries need strict semver, applications can be flexible
- Evaluate the deployment pipeline: does release trigger a deploy, or are they independent?
- Assess rollback requirements: databases, caches, CDNs each have different rollback needs

## Output formatting
- YAML blocks for workflows, JSON for config, bash for CLI commands
- Include migration checklist when moving from manual to automated
- Show the complete flow: commit → changelog → tag → release → deploy

## Constraints
- Never suggest manual changelog editing as the primary strategy
- Never recommend \`npm version\` without surrounding automation
- Always include rollback strategy when discussing deployment
- Always mention flag cleanup when recommending feature flags
- Never suggest force-pushing tags — delete and recreate if needed`,
      agents: `# AGENTS.md — GitHub Release Management

## Purpose
Ensure releases are versioned correctly, automated, traceable, and safely deployable with rollback.

## Review checklist
1. Is versioning following semantic versioning conventions?
2. Is the changelog automated from commits or changesets (not manually edited)?
3. Are GitHub Releases created with every version bump?
4. Is the release workflow pinned to SHA hashes for all actions?
5. Are deployment environments configured with approval gates for production?
6. Is there a documented and tested rollback procedure?
7. Are feature flags tracked with owners and cleanup dates?
8. Are pre-releases clearly distinguished from production releases?
9. Is the team notified on successful releases and failures?
10. Are npm tokens / deploy secrets rotated on a schedule?

## Quality gates
- Every merge to main should either create a release PR or be included in the next one
- Changelog must be generated automatically — manual entries indicate process failure
- Rollback must be executable in under 5 minutes
- Feature flags older than 30 days without cleanup should trigger alerts

## Failure protocol
- If a release fails to publish, retry once then alert the team
- If a canary deploy fails health checks, auto-rollback to previous deployment
- If a feature flag is stuck enabled, the owner is responsible for immediate cleanup
- If changelog generation fails, block the release until fixed

## Anti-patterns to flag
- Manual version bumps in \`package.json\` without automation
- Changelog entries that say "various fixes" or "updates"
- Feature flags without documented owners or expiry dates
- Releases without corresponding git tags
- Production deploys without environment approval gates
- Rollback procedures that have never been tested`
    }
  }
];
