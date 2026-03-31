/**
 * Reference templates for skill body and agent doc authoring.
 * Used by the user-skill-form default body and as a guide for seed data authors.
 */

export const SKILL_BODY_TEMPLATE = `# {Title}

{One-paragraph executive summary: what this skill does, who it's for, and when to reach for it.}

## When to use

- {Concrete trigger condition 1}
- {Concrete trigger condition 2}
- Use this when {scenario}

## When NOT to use

- Do not use for {anti-pattern 1} — reach for {alternative} instead
- Do not use when {condition} — {reason}

## Core concepts

{Key mental models, terminology, and architecture patterns. Use tables where useful.}

| Concept | Description |
|---------|-------------|
| {Term 1} | {Definition} |
| {Term 2} | {Definition} |

## Workflow

### Step 1: {Verb phrase}
- Detailed instructions with rationale
- Code examples in fenced blocks where applicable

### Step 2: {Verb phrase}
- {Instructions}

### Step 3: {Verb phrase}
- {Instructions}

## Examples

### Example 1: {Scenario name}

\`\`\`{language}
{Concrete, runnable code or config with annotations}
\`\`\`

### Example 2: {Scenario name}

\`\`\`{language}
{Code}
\`\`\`

## Decision tree

- When {X} → do {Y}
- When {Z} → do {W}
- If unsure → {default recommendation}

## Edge cases and gotchas

1. {Non-obvious failure mode 1} — mitigation: {fix}
2. {Non-obvious failure mode 2} — mitigation: {fix}
3. {Non-obvious failure mode 3} — mitigation: {fix}

## Evaluation criteria

- [ ] {Measurable quality check 1}
- [ ] {Measurable quality check 2}
- [ ] {Measurable quality check 3}
`;

export const AGENT_DOC_TEMPLATES = {
  codex: `# Codex — {Skill Title}

## Environment
- Codex runs in a sandboxed environment: file I/O only, no browser, no GUI
- Network access may be restricted — prefer local operations when possible
- Working directory is the project root

## When this skill is active
- {Directive 1: what to do}
- {Directive 2: what to check}
- {Directive 3: how to apply}

## Tool usage
- Use file read/write for configuration changes
- Use shell commands for build and test verification
- Prefer non-interactive commands (no -i flags, no prompts)

## Testing expectations
- Run the test suite after every change
- Verify no regressions with \`pnpm test\` or equivalent
- Check for linter errors with \`pnpm lint\`

## Common failure modes
- {Failure 1}: {how to detect and recover}
- {Failure 2}: {how to detect and recover}

## Output format
- Write changes directly to files
- Summarize what was changed and why in the response
- Include before/after comparisons for significant changes
`,

  cursor: `# Cursor — {Skill Title}

## IDE context
- You have access to the full project via file editing, search, and multi-file operations
- Linter feedback is available in real time
- You can run terminal commands for builds, tests, and git operations

## When this skill applies
- {Rule 1: what to do during code generation}
- {Rule 2: what patterns to follow}
- {Rule 3: what to avoid}

## Code style
- Follow existing project patterns and conventions
- Use the same formatting, naming, and file organization as the codebase
- Prefer explicit types over \`any\`

## Cursor features to leverage
- Use multi-file edit for refactors that span multiple files
- Use search to find existing patterns before writing new code
- Check linter output after edits

## Review checklist
- [ ] Does the change follow existing project patterns?
- [ ] Are imports organized correctly?
- [ ] Is error handling present?
- [ ] Are types explicit (no \`any\`)?
- [ ] Are edge cases handled?
`,

  claude: `# Claude — {Skill Title}

## Interaction patterns
- When the user invokes this skill, apply it to the current task context
- Ask clarifying questions if the task is ambiguous before proceeding
- Structure your response to show reasoning, then implementation

## Response structure
1. **Assessment** — briefly state what you're working with and what needs to change
2. **Plan** — outline the approach before implementing
3. **Implementation** — make the changes with clear explanations
4. **Verification** — describe how to verify the changes work

## Chain-of-thought guidance
- Think through edge cases before writing code
- Consider alternatives and explain why you chose the approach you did
- Flag trade-offs explicitly rather than making silent decisions

## Output formatting
- Use code blocks with language tags for all code
- Use headers to organize multi-part responses
- Keep explanations concise — code should be self-documenting where possible
- Reference specific files and line numbers when discussing existing code

## Constraints
- {Constraint 1}
- {Constraint 2}
`,

  agents: `# AGENTS.md — {Skill Title}

## Purpose
{One-sentence description of what this skill does in agent context.}

## Review checklist
1. {Actionable check 1}
2. {Actionable check 2}
3. {Actionable check 3}
4. {Actionable check 4}
5. {Actionable check 5}

## Quality gates
- {Gate 1: condition that must be true before the skill is "applied"}
- {Gate 2: condition}
- {Gate 3: condition}

## Related skills
- {Skill 1}: {when to use instead or in addition}
- {Skill 2}: {when to use instead or in addition}

## Escalation criteria
- Escalate to a human when {condition 1}
- Escalate when {condition 2}
`,
} as const;
