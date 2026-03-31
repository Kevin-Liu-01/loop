import type { CreateSkillInput } from "@/lib/db/skills";

type SeedSkill = Omit<CreateSkillInput, "origin"> & {
  origin?: CreateSkillInput["origin"];
};

export const frontend: SeedSkill[] = [
  // -----------------------------------------------------------------------
  // 1. Frontend Frontier
  // -----------------------------------------------------------------------
  {
    slug: "frontend-frontier",
    title: "Frontend Frontier",
    description:
      "Art direction, motion systems, design-engineering references, and tokenized design systems built with Figma, Tailwind, and Motion.",
    category: "frontend",
    accent: "signal-red",
    featured: true,
    visibility: "public",
    tags: ["featured", "editorial-ui", "motion", "design-system", "art-direction"],
    body: `# Frontend Frontier

The gap between a shipped page and a memorable page is art direction. Frontend Frontier is a skill for engineers who refuse to default to generic SaaS aesthetics. It covers choosing a visual thesis, building a tokenized design system, wiring up a coherent motion layer, and evaluating craft quality against manual-grade references.

## When to use

- Starting a greenfield marketing site, landing page, or product homepage that needs a distinctive look
- Redesigning or upgrading an existing UI that looks like "every other AI SaaS"
- Building a component library where tokens, motion, and depth need to feel intentional
- Reviewing pull requests for design coherence, motion quality, and token compliance
- Creating a hero scene that combines 3D, shaders, or heavy animation with readable UI
- Choosing between editorial, cinematic, brutalist, or experimental visual directions

## When NOT to use

- Pure backend API work with no visual output — this skill is frontend-only
- Simple CRUD admin dashboards where stock component libraries suffice — prefer Tailwind Design System or shadcn defaults
- Documentation-heavy sites where readability beats spectacle — keep motion minimal
- Accessibility-first audits — reach for the Accessible UI skill instead
- Performance profiling without a design goal — use Web Performance

## Core concepts

### Art direction modes

Every project starts by picking one primary visual thesis. Do not mix modes without intent.

| Mode | Character | Best for |
|------|-----------|----------|
| Editorial technical | Dense type hierarchy, restrained color, data-forward | Devtools, analytics dashboards, API docs |
| Cinematic 3D | Depth, camera movement, immersive hero | Product launches, portfolio pieces |
| Architectural blueprint | Grid precision, diagrammatic clarity, technical rigor | Infrastructure tools, system visualizers |
| Neo-brutalist | High contrast, raw energy, anti-polish | Creative tools, indie products |
| Experimental lab | Novelty-driven, research aesthetic, generative visuals | Research platforms, AI playgrounds |
| Premium AI SaaS | Trust, restraint, subtle depth, enterprise credibility | B2B AI products competing on reliability |

### Motion layers

Motion is a three-layer system:

1. **Ambient** — slow loops, shader drift, environmental life that exists without user input
2. **Interaction** — hover, press, open, focus — immediate feedback tied to user actions
3. **Narrative** — scroll-driven and route-change choreography that guides the user through a story

One strong hero move beats many small distractions. If a page has a heavy 3D or shader hero, quiet the rest of the UI motion.

### Token system

Before building any component, define tokens for: color, spacing, radii, shadows, border weights, type scale, z-index, blur, and motion duration/easing.

## Workflow

### 1. Choose your art direction mode

Evaluate the product, audience, and competitive landscape. Pick one primary mode from the table above. Write it down in your project brief or design doc.

### 2. Set up the token system with Tailwind v4 \`@theme\`

\`\`\`css
@theme {
  --color-surface: oklch(0.98 0.005 260);
  --color-surface-elevated: oklch(1 0 0);
  --color-accent: oklch(0.65 0.25 29);
  --color-accent-subtle: oklch(0.65 0.15 29 / 0.15);
  --color-text-primary: oklch(0.15 0.01 260);
  --color-text-secondary: oklch(0.45 0.01 260);

  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2.5rem;
  --space-2xl: 4rem;
  --space-3xl: 6rem;

  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-card: 1rem;
  --radius-pill: 9999px;

  --shadow-subtle: 0 1px 2px oklch(0 0 0 / 0.05);
  --shadow-elevated: 0 4px 12px oklch(0 0 0 / 0.08), 0 1px 3px oklch(0 0 0 / 0.04);

  --font-display: "Instrument Serif", serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --duration-fast: 120ms;
  --duration-normal: 250ms;
  --duration-slow: 500ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
\`\`\`

### 3. Wire up the Motion component layer

\`\`\`tsx
import { motion } from "motion/react";

function HeroHeadline({ children }: { children: React.ReactNode }) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="font-display text-5xl text-text-primary"
    >
      {children}
    </motion.h1>
  );
}
\`\`\`

### 4. Layer in GSAP for scroll choreography (when needed)

\`\`\`tsx
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function ScrollSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".reveal-item", {
        y: 60,
        opacity: 0,
        stagger: 0.12,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return <div ref={ref}>{/* children */}</div>;
}
\`\`\`

### 5. Review against craft benchmarks

Compare your output against manual-grade references: userinterface.wiki, Rauno's site, Devouring Details, Interface Craft, UI Playbook. Ask: does this feel authored, or generated?

## Examples

### Example 1 — Premium AI SaaS hero section

Token-driven, restrained depth, subtle ambient motion:

\`\`\`tsx
<section className="relative overflow-hidden bg-surface px-space-xl py-space-3xl">
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    className="mx-auto max-w-3xl text-center"
  >
    <h1 className="font-display text-6xl text-text-primary text-balance">
      Intelligence you can trust
    </h1>
    <p className="mt-space-md text-lg text-text-secondary">
      Enterprise AI infrastructure that scales with your ambition.
    </p>
  </motion.div>
</section>
\`\`\`

### Example 2 — Neo-brutalist card

High contrast, raw borders, no soft shadows:

\`\`\`tsx
<div className="border-2 border-text-primary bg-surface p-space-lg">
  <h3 className="font-mono text-sm uppercase tracking-widest text-accent">
    Module 04
  </h3>
  <p className="mt-space-sm font-sans text-xl font-bold text-text-primary">
    Break every assumption about what a card should look like.
  </p>
</div>
\`\`\`

## Decision tree

- **Need a distinctive landing page?** → Start here with art direction mode selection
- **Need component animation?** → Use Motion (Framer Motion skill)
- **Need scroll choreography?** → Use GSAP + ScrollTrigger skill
- **Need 3D hero scene?** → Use React Three Fiber skill
- **Need token system only?** → Use Tailwind Design System skill
- **Need performance audit?** → Use Web Performance skill
- **Multiple concerns?** → Start here, then delegate to specific skills

## Edge cases and gotchas

1. **Heavy animation + readability conflict** — Above-the-fold copy and CTA must remain readable while motion runs. Test by pausing the animation: if the page makes no sense frozen, the hierarchy is wrong.
2. **prefers-reduced-motion** — Every ambient and narrative animation must degrade to static under \`prefers-reduced-motion: reduce\`. Interaction motion can simplify but should not vanish entirely (users still need feedback).
3. **Mobile performance** — Canvas, heavy blur, backdrop-filter, and large shadow animations are expensive on mobile. Profile on a real mid-range device, not just DevTools throttling.
4. **Token drift** — When tokens are not enforced, arbitrary values creep in within weeks. Use Tailwind's strict mode or a lint rule to flag raw values in design-critical properties.
5. **Art direction scope creep** — Mixing two modes (e.g., editorial + cinematic) almost always produces mud. Pick one, commit, and only borrow from another mode for a specific justified element.
6. **Font loading flash** — Display fonts cause layout shift if not preloaded. Use \`font-display: swap\` with a closely-matched system fallback and preload the font file.

## Evaluation criteria

- [ ] A single art direction mode is chosen and documented
- [ ] Token system covers color, spacing, radii, shadow, type, motion
- [ ] Tokens are defined in \`@theme\` before any component styling
- [ ] Motion follows the three-layer model (ambient, interaction, narrative)
- [ ] Hero focal point is singular and does not compete with other animations
- [ ] \`prefers-reduced-motion\` fallbacks are implemented
- [ ] Mobile performance is profiled on a real device
- [ ] No raw hex values, arbitrary spacing, or accidental radius drift
- [ ] Above-the-fold copy is readable while motion runs
- [ ] Output is compared against at least one craft reference`,
    agentDocs: {
      codex: `# Codex — Frontend Frontier

## Environment
This skill operates in a sandboxed environment with file I/O only. No browser preview is available — generate code that is self-contained and testable via build tooling.

## When this skill is active
- Always ask for or determine the art direction mode before writing any UI code.
- Default to Tailwind v4 \`@theme\` tokens — never use arbitrary values for color, spacing, or radii.
- Use Motion (motion/react) for component-level animation.
- Use GSAP + ScrollTrigger for scroll choreography and timeline sequences.
- Emit CSS custom properties from \`@theme\`, not JS-only token objects.

## Tool usage
- Use file read/write to scaffold token files, component files, and layout files.
- Generate a \`globals.css\` with a complete \`@theme\` block before any component code.
- Place components in \`components/\` with one primary export per file.
- Place hooks in \`hooks/\` and utilities in \`lib/\`.

## Testing expectations
- Every animation component should have a \`prefers-reduced-motion\` branch.
- Verify that token values compile: run \`pnpm build\` or \`npx tailwindcss --input globals.css --output /dev/null\` as a smoke test.
- Snapshot test static renders to catch regressions in class usage.

## Common failure modes
- Generating UI without choosing an art direction mode first.
- Using raw hex colors or arbitrary Tailwind values instead of tokens.
- Forgetting \`gsap.context()\` cleanup in React useEffect.
- Shipping blur or shadow animations without profiling mobile performance.
- Mixing two art direction modes without justification.

## Output format
- Code files: one file per concern (tokens, components, hooks).
- Always include the \`@theme\` block in full when creating a new project.
- Annotate which art direction mode was chosen at the top of the main layout file.`,
      cursor: `# Cursor — Frontend Frontier

## IDE context
This skill is designed for use in Cursor IDE where inline code generation and multi-file editing are primary workflows.

## Rules for code generation
- Read the art direction mode from any existing skill body or project brief before generating UI.
- Never default to Inter, Roboto, or stock shadcn styles unless the project explicitly uses them.
- Use OKLCH for all custom color authoring — not hex, not HSL.
- Animate \`transform\` and \`opacity\` first. Only use \`filter\`, \`backdrop-filter\`, or animated shadows after confirming acceptable performance.
- Keep text and CTA zones on calmer motion layers than decorative elements.

## Code style
- Token references via Tailwind utilities: \`bg-surface\`, \`text-accent\`, \`rounded-card\`.
- Template literal class strings with \`cn()\` or \`clsx()\` for conditional classes.
- Motion components from \`motion/react\` (v11+), not the legacy \`framer-motion\` import.
- GSAP cleanup via \`gsap.context()\` in useEffect return.

## Cursor features to leverage
- Use multi-file editing to create token file + component file in one pass.
- Use inline diff to compare before/after when adjusting animation timing.
- Use Cmd+K to generate token scales quickly, then review for OKLCH correctness.

## Review checklist
- [ ] Art direction mode is stated and consistent across all generated files
- [ ] All color, spacing, and radius values trace back to \`@theme\` tokens
- [ ] Motion is layered (ambient, interaction, narrative) — not sprinkled randomly
- [ ] \`prefers-reduced-motion\` media query or \`useReducedMotion()\` is present
- [ ] Hero section has one focal point, one CTA, and one proof element
- [ ] No competing accent colors — 3 max plus neutrals`,
      claude: `# Claude — Frontend Frontier

## Interaction patterns
When a user asks about frontend art direction or design systems:
1. Ask clarifying questions about the product type, audience, and competitive context.
2. Recommend an art direction mode with reasoning.
3. Provide token definitions before component code.
4. Show before/after comparisons when critiquing existing UI.

## Response structure
Follow this order for every substantial response:
1. **Assessment** — What art direction mode fits? What tokens are needed?
2. **Plan** — Token definitions → layout structure → component hierarchy → motion layer
3. **Implementation** — Code with tokens applied, motion wired, and fallbacks included
4. **Verification** — Checklist review against evaluation criteria

## Chain-of-thought guidance
- Think through the visual hierarchy before writing markup: what is the single hero element? Where does the eye go first?
- Consider mobile constraints before desktop flourishes.
- Evaluate whether motion adds meaning or just adds load time.
- Compare mental model against one craft reference (userinterface.wiki, Rauno, etc.).

## Output formatting
- Use fenced code blocks with language tags for all code examples.
- Show \`@theme\` token blocks in CSS, component code in TSX.
- When comparing options, use a two-column table with tradeoffs.
- Keep code examples focused — one concept per block, not entire files.

## Constraints
- Never suggest more than one art direction mode per project without explicit justification.
- Never output raw hex colors when OKLCH is available.
- Always include \`prefers-reduced-motion\` considerations in animation recommendations.
- Do not recommend Lenis for content-heavy documentation sites.`,
      agents: `# AGENTS.md — Frontend Frontier

## Purpose
Ensure every frontend deliverable has a clear visual thesis, a token-driven design system, and a coherent motion layer — with no generic defaults.

## Review checklist
1. Does the page or component declare a single art direction mode?
2. Are all design tokens (color, spacing, radii, shadow, type, motion) defined in \`@theme\` before component code?
3. Is motion used as a three-layer system (ambient, interaction, narrative) or sprinkled randomly?
4. Does the hero focal point earn attention without competing elements?
5. Are blur, shadow, and filter animations profiled for mobile performance?
6. Is \`prefers-reduced-motion\` handled for all ambient and narrative animation?
7. Are there no raw hex values or arbitrary Tailwind classes in design-critical positions?

## Quality gates
- **Token coverage**: every color, spacing, and radius value must trace to a token.
- **Motion budget**: no more than one heavy ambient animation per viewport.
- **Craft comparison**: output should hold up against at least one manual-grade reference site.
- **Mobile parity**: the mobile experience must feel intentional, not just reflowed.

## Related skills
- Tailwind Design System — for deep token work
- Framer Motion — for component-level animation details
- GSAP + ScrollTrigger — for scroll choreography
- React Three Fiber — for 3D hero scenes
- Web Performance — for profiling animation cost

## Escalation criteria
- If performance on mobile drops below 50fps during animation, escalate to Web Performance skill.
- If accessibility concerns arise from motion or contrast, escalate to Accessible UI skill.
- If the project requires 3D beyond a simple hero, escalate to React Three Fiber skill.`
    }
  },

  // -----------------------------------------------------------------------
  // 2. Framer Motion
  // -----------------------------------------------------------------------
  {
    slug: "motion-framer",
    title: "Framer Motion",
    description:
      "React animation with Framer Motion components, variants, gestures, layout animations, AnimatePresence, spring physics, and scroll effects.",
    category: "frontend",
    accent: "signal-red",
    tags: ["animation", "react", "motion", "framer-motion", "gestures"],
    body: `# Framer Motion

Production-ready animation library for React. Motion (formerly Framer Motion) is the default choice for component-level animation: enter/exit transitions, layout shifts, gesture responses, spring physics, and scroll-linked effects. It integrates deeply with React's component model and handles the hard parts — interrupted animations, layout measurement, exit choreography — so you can focus on feel.

## When to use

- Component mount/unmount transitions (modals, toasts, dropdowns, page transitions)
- Layout animations when elements reorder, resize, or move across containers
- Hover, tap, drag, and focus micro-interactions
- Shared element transitions across routes (with \`layoutId\`)
- Spring-based physics for interactive feel (sliders, toggles, cards)
- Scroll-linked opacity or parallax on individual elements

## When NOT to use

- Scroll-driven pinning, scrubbing, or multi-section choreography — use GSAP + ScrollTrigger
- Complex multi-surface orchestration (DOM + Canvas + WebGL simultaneously) — use GSAP timelines
- Non-React projects — Motion is React-first; use GSAP or anime.js for vanilla JS
- CSS-only hover states where a 2-line transition suffices — do not over-engineer
- Performance-critical loops rendering thousands of animated items — profile first

## Core concepts

### motion components

Wrap any HTML or SVG element with animation superpowers:

\`\`\`tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>
\`\`\`

### Variants

Named animation states that propagate through component trees:

\`\`\`tsx
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.ul variants={container} initial="hidden" animate="visible">
  {items.map((i) => (
    <motion.li key={i.id} variants={item} />
  ))}
</motion.ul>
\`\`\`

### AnimatePresence

Animate components as they unmount:

\`\`\`tsx
<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    />
  )}
</AnimatePresence>
\`\`\`

### Layout animations

Automatic interpolation when elements change position or size:

\`\`\`tsx
<motion.div layout className={isExpanded ? "w-full" : "w-48"}>
  <motion.p layout="position">Content stays in place</motion.p>
</motion.div>
\`\`\`

### Shared layout with layoutId

Seamless element transitions across different components:

\`\`\`tsx
{items.map((item) => (
  <motion.div key={item.id} layoutId={item.id} onClick={() => setSelected(item)}>
    {item.title}
  </motion.div>
))}

{selected && (
  <motion.div layoutId={selected.id} className="expanded-card">
    {selected.details}
  </motion.div>
)}
\`\`\`

### Spring configuration

| Preset | stiffness | damping | mass | Feel |
|--------|-----------|---------|------|------|
| Snappy | 300 | 25 | 0.5 | Quick, responsive toggle |
| Gentle | 120 | 14 | 1 | Soft card entrance |
| Bouncy | 400 | 10 | 1 | Playful overshoot |
| Heavy | 200 | 30 | 2 | Weighty drag |

\`\`\`tsx
<motion.div
  animate={{ x: 100 }}
  transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
/>
\`\`\`

## Workflow

### 1. Identify the animation type

Classify what you are animating: enter/exit, layout shift, gesture response, or scroll-linked. This determines which Motion API to use.

### 2. Define variants for reusable states

Extract animation states into variant objects. Keep them in a shared file if multiple components use the same entrance pattern.

### 3. Wire up AnimatePresence for exits

Wrap conditionally rendered elements in \`<AnimatePresence>\`. Use \`mode="wait"\` when the next element should wait for the previous one to finish exiting.

### 4. Tune spring physics

Start with a preset from the table above. Adjust \`stiffness\` for speed, \`damping\` for overshoot, and \`mass\` for weight. Test on a real device.

### 5. Add reduced-motion fallbacks

\`\`\`tsx
import { useReducedMotion } from "motion/react";

function AnimatedCard() {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    />
  );
}
\`\`\`

## Examples

### Example 1 — Staggered list entrance

\`\`\`tsx
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

function FeatureList({ features }: { features: string[] }) {
  return (
    <motion.ul variants={listVariants} initial="hidden" animate="visible">
      {features.map((f) => (
        <motion.li key={f} variants={itemVariants}>{f}</motion.li>
      ))}
    </motion.ul>
  );
}
\`\`\`

### Example 2 — Gesture-driven card

\`\`\`tsx
<motion.div
  whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
  className="cursor-pointer rounded-card bg-surface-elevated p-space-lg"
>
  <h3>Interactive card</h3>
</motion.div>
\`\`\`

### Example 3 — Page route transition

\`\`\`tsx
<AnimatePresence mode="wait">
  <motion.main
    key={pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25 }}
  >
    {children}
  </motion.main>
</AnimatePresence>
\`\`\`

## Decision tree

- **Component enter/exit?** → AnimatePresence + initial/animate/exit
- **List with staggered items?** → Variants with staggerChildren
- **Element changes position/size?** → \`layout\` prop
- **Shared element across views?** → \`layoutId\`
- **Hover/tap/drag interaction?** → Gesture props (whileHover, whileTap, whileDrag)
- **Scroll-driven pinning or scrubbing?** → NOT Motion — use GSAP ScrollTrigger
- **Multi-surface orchestration?** → NOT Motion — use GSAP timelines
- **Simple 2-property hover?** → Consider CSS transition first

## Edge cases and gotchas

1. **Import path changed in v11+** — Use \`"motion/react"\`, not \`"framer-motion"\`. The old import still works but is deprecated.
2. **AnimatePresence requires keys** — Every direct child of AnimatePresence must have a unique \`key\` prop, or exit animations will not trigger.
3. **layout + border-radius** — The layout animation can distort border-radius during interpolation. Use \`layout="position"\` if only position should animate.
4. **Exit animations and React strict mode** — In development strict mode, components mount twice which can cause double-animation. Test exit behavior in production builds.
5. **Spring oscillation** — Low damping values cause visible oscillation. For UI elements that should land cleanly, keep damping above 15.
6. **Server-side rendering** — Motion components render their \`initial\` state on the server. Ensure \`initial\` values produce a usable static layout.

## Evaluation criteria

- [ ] Import from \`"motion/react"\` (v11+), not \`"framer-motion"\`
- [ ] \`useReducedMotion()\` checked and fallbacks provided
- [ ] Exit animations wrapped in \`<AnimatePresence>\` with keys
- [ ] Spring configs are tuned to match the interaction feel (not default values)
- [ ] Enter animations are split into semantic chunks with stagger
- [ ] Exit animations are subtler than enter animations
- [ ] No competing animations on the same element
- [ ] Layout animations use \`layout="position"\` when only position should change
- [ ] Gesture interactions have visible hover/press feedback`,
    agentDocs: {
      codex: `# Codex — Framer Motion

## Environment
Sandboxed with file I/O. No browser preview — ensure animation code is structurally correct and testable via build.

## When this skill is active
- Import from \`"motion/react"\` (v11+), never \`"framer-motion"\`.
- Use spring physics for interactive states (hover, tap, drag), tween for staged one-shot sequences.
- Always wrap conditionally rendered animated elements in \`<AnimatePresence>\`.
- Use \`layoutId\` for cross-route shared element transitions.
- Check \`useReducedMotion()\` and provide static fallbacks.

## Tool usage
- Generate animation variant objects in separate files: \`lib/motion-variants.ts\`.
- One animated component per file in \`components/\`.
- Include spring presets in a constants file for reuse.

## Testing expectations
- Snapshot tests should capture the initial rendered state (which reflects the \`initial\` prop).
- Reduced-motion branch should produce a valid static render.
- AnimatePresence exit: verify the key prop is present on every direct child.

## Common failure modes
- Forgetting \`key\` on AnimatePresence children — exits silently break.
- Using \`layout\` when only position should animate — border-radius distortion.
- Default spring config feels mushy — always tune stiffness and damping.
- Import from deprecated \`"framer-motion"\` path instead of \`"motion/react"\`.
- Not handling SSR — initial state must be a valid static layout.

## Output format
- Code: TSX components with typed props.
- Variants: exported objects in \`lib/motion-variants.ts\`.
- Spring presets: named constants in \`lib/motion-constants.ts\`.`,
      cursor: `# Cursor — Framer Motion

## IDE context
Motion components are JSX — Cursor's TypeScript support provides full autocompletion for motion props, transition objects, and variant types.

## Rules for code generation
- Prefer \`motion\` components over CSS keyframes for any React animation more complex than a 2-property hover.
- Use variants for reusable animation states across component trees.
- Stagger children with \`transition.staggerChildren\` on the parent variant.
- \`AnimatePresence\` needs \`mode="wait"\` for sequential transitions, \`mode="popLayout"\` when the exiting element should not block the entering one.
- Use \`layout="position"\` when only position should animate (avoids border-radius distortion).

## Code style
- Spring presets as named objects: \`const SPRING_SNAPPY = { type: "spring", stiffness: 300, damping: 25 }\`.
- Variant objects extracted to module scope, not defined inline.
- \`useReducedMotion()\` called once in the component body, referenced in \`initial\` prop.
- Gesture props (\`whileHover\`, \`whileTap\`) on the same element — do not nest.

## Cursor features to leverage
- Inline suggestions for \`transition\` objects — accept and tune.
- Multi-cursor to update spring configs across multiple components simultaneously.
- Cmd+K to generate variant objects from a description, then review the output.

## Review checklist
- [ ] Import path is \`"motion/react"\`, not \`"framer-motion"\`
- [ ] Every AnimatePresence child has a unique \`key\`
- [ ] Spring configs are intentionally tuned, not defaults
- [ ] Reduced-motion fallback is present
- [ ] Exit animations are lighter than enter animations
- [ ] No layout animation distorting border-radius unnecessarily`,
      claude: `# Claude — Framer Motion

## Interaction patterns
When a user asks about React animation:
1. Determine if Motion is the right tool (vs GSAP, CSS, or another library).
2. Identify the animation category: enter/exit, layout, gesture, scroll, or shared layout.
3. Provide a focused code example with the right API.
4. Include spring tuning guidance when physics are involved.

## Response structure
1. **Assessment** — Is this a Motion use case? What specific API is needed?
2. **Plan** — Which motion components, variants, or hooks solve the problem?
3. **Implementation** — Focused code example with spring config and reduced-motion handling.
4. **Verification** — Does the animation meet the evaluation criteria?

## Chain-of-thought guidance
- Think about what the animation communicates to the user, not just what it looks like.
- Consider the interruption case: what happens if the user triggers the animation again mid-flight?
- For layout animations, think about what properties are actually changing (position only? or size too?).
- For exit animations, default to subtler than the entrance.

## Output formatting
- Code examples in TSX with typed props.
- Spring presets in a table when comparing options.
- Show the variant object separately from the component JSX for clarity.
- Include the \`useReducedMotion\` pattern in every non-trivial example.

## Constraints
- Never suggest CSS keyframes as the primary approach for React component animation.
- Never omit \`useReducedMotion\` in examples that involve ambient or narrative motion.
- Always use \`"motion/react"\` import path.
- Do not use Motion for scroll-driven pinning — recommend GSAP ScrollTrigger instead.`,
      agents: `# AGENTS.md — Framer Motion

## Purpose
Ensure all React animation is well-structured, accessible, performant, and uses the correct Motion APIs.

## Review checklist
1. Is the import path \`"motion/react"\` (not \`"framer-motion"\`)?
2. Does every AnimatePresence direct child have a unique \`key\` prop?
3. Are spring configs explicitly tuned (stiffness, damping, mass) rather than using defaults?
4. Is \`useReducedMotion()\` checked with appropriate fallback behavior?
5. Are exit animations subtler than enter animations?
6. Is \`layout="position"\` used when only position changes (not size)?
7. Are variant objects extracted to module scope rather than defined inline?
8. Are gesture interactions (\`whileHover\`, \`whileTap\`) not nested across parent/child?

## Quality gates
- **SSR safety**: the \`initial\` state must produce a valid, readable static layout.
- **Interruption handling**: spring-based animations are interruptible by default — verify this is preserved.
- **Bundle impact**: Motion is ~18KB gzipped. If only trivial animations are needed, confirm the library is justified.

## Related skills
- GSAP + ScrollTrigger — for scroll-driven choreography
- Frontend Frontier — for motion layer strategy
- Web Performance — for profiling animation cost
- React Component Architecture — for component organization

## Escalation criteria
- If scroll-driven pinning or scrubbing is needed, escalate to GSAP + ScrollTrigger.
- If animation causes frame drops below 50fps, escalate to Web Performance.
- If the animation involves 3D transforms or WebGL, escalate to React Three Fiber.`
    }
  },

  // -----------------------------------------------------------------------
  // 3. GSAP + ScrollTrigger
  // -----------------------------------------------------------------------
  {
    slug: "gsap-scrolltrigger",
    title: "GSAP + ScrollTrigger",
    description:
      "Animation timelines, scroll-driven experiences, pinning, scrubbing, parallax, and cross-surface choreography with GSAP.",
    category: "frontend",
    accent: "signal-red",
    tags: ["animation", "gsap", "scroll", "parallax", "timeline"],
    body: `# GSAP + ScrollTrigger

The industry-standard animation platform for complex timelines, scroll-driven narratives, and cross-surface choreography. GSAP handles what CSS transitions and Motion cannot: frame-perfect orchestration across heterogeneous targets (DOM, Canvas, WebGL, SVG), scroll-linked pinning and scrubbing, and timeline sequences with labels and callbacks.

## When to use

- Scroll-driven pinning or scrubbing sections that teach the user something
- Multi-element orchestrated sequences with precise timing control
- Mixed-surface animations: DOM elements + Canvas + WebGL coordinated together
- Complex SVG or path animations with morphing
- Parallax effects that go beyond simple CSS transforms
- Any animation requiring frame-perfect control with \`gsap.ticker\`

## When NOT to use

- Simple component enter/exit animations in React — use Motion
- Hover, tap, and focus micro-interactions — use Motion gesture props
- Layout animations where elements reorder — use Motion \`layout\` prop
- Static sites with no JavaScript — use CSS transitions/keyframes
- Dense documentation pages — do not add Lenis or scroll choreography

## Core concepts

### Tween types

| Method | Purpose | Example |
|--------|---------|---------|
| \`gsap.to()\` | Animate from current state to target | Fade an element to opacity 0 |
| \`gsap.from()\` | Animate from target to current state | Reveal from below |
| \`gsap.fromTo()\` | Explicit start and end states | Controlled slide |
| \`gsap.set()\` | Instant property set (no animation) | Initialize positions |

### Timelines

Sequenced animation chains with control:

\`\`\`tsx
const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power3.out" } });
tl.from(".hero-title", { y: 60, opacity: 0 })
  .from(".hero-subtitle", { y: 40, opacity: 0 }, "-=0.3")
  .from(".hero-cta", { y: 30, opacity: 0, scale: 0.95 }, "-=0.2")
  .addLabel("heroComplete");
\`\`\`

### ScrollTrigger

Ties animation progress to scroll position:

\`\`\`tsx
gsap.registerPlugin(ScrollTrigger);

gsap.to(".parallax-bg", {
  y: -200,
  scrollTrigger: {
    trigger: ".parallax-section",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
  },
});
\`\`\`

### Pin + Scrub pattern

Hold an element fixed while the user scrolls through a section:

\`\`\`tsx
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".story-section",
    start: "top top",
    end: "+=300%",
    pin: true,
    scrub: 1,
  },
});
tl.to(".step-1", { opacity: 1, y: 0 })
  .to(".step-1", { opacity: 0 })
  .to(".step-2", { opacity: 1, y: 0 })
  .to(".step-2", { opacity: 0 })
  .to(".step-3", { opacity: 1, y: 0 });
\`\`\`

## Workflow

### 1. Register plugins

\`\`\`tsx
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
\`\`\`

### 2. Use gsap.context() for React cleanup

\`\`\`tsx
import { useRef, useLayoutEffect } from "react";

function AnimatedSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".reveal", {
        y: 60,
        opacity: 0,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return <div ref={containerRef}>{/* children */}</div>;
}
\`\`\`

### 3. Responsive ScrollTrigger with matchMedia

\`\`\`tsx
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    ScrollTrigger.matchMedia({
      "(min-width: 768px)": () => {
        gsap.to(".sidebar", {
          x: 0,
          scrollTrigger: { trigger: ".content", start: "top top", pin: true },
        });
      },
      "(max-width: 767px)": () => {
        gsap.set(".sidebar", { x: 0 });
      },
    });
  }, containerRef);
  return () => ctx.revert();
}, []);
\`\`\`

### 4. Integrate Lenis for smooth scroll sync

\`\`\`tsx
import Lenis from "lenis";

useEffect(() => {
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(lenis.raf);
    lenis.destroy();
  };
}, []);
\`\`\`

### 5. Performance budgets

- Keep total active ScrollTrigger instances under 20 per page
- Animate \`transform\` and \`opacity\` — avoid animating \`width\`, \`height\`, \`top\`, \`left\`
- Use \`will-change: transform\` sparingly and remove it after animation completes
- Test on mobile with real devices — not just DevTools throttling

## Examples

### Example 1 — Text reveal on scroll

\`\`\`tsx
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>(".split-line").forEach((line) => {
      gsap.from(line, {
        y: "100%",
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: line, start: "top 90%" },
      });
    });
  }, containerRef);
  return () => ctx.revert();
}, []);
\`\`\`

### Example 2 — Horizontal scroll section

\`\`\`tsx
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    const panels = gsap.utils.toArray<HTMLElement>(".panel");
    gsap.to(panels, {
      xPercent: -100 * (panels.length - 1),
      ease: "none",
      scrollTrigger: {
        trigger: ".horizontal-container",
        pin: true,
        scrub: 1,
        end: () => "+=" + document.querySelector(".horizontal-container")!.scrollWidth,
      },
    });
  }, containerRef);
  return () => ctx.revert();
}, []);
\`\`\`

### Example 3 — Counter animation

\`\`\`tsx
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    const counter = { value: 0 };
    gsap.to(counter, {
      value: 10000,
      duration: 2,
      ease: "power1.out",
      scrollTrigger: { trigger: ".counter-section", start: "top 75%" },
      onUpdate: () => {
        document.querySelector(".counter")!.textContent =
          Math.round(counter.value).toLocaleString();
      },
    });
  }, containerRef);
  return () => ctx.revert();
}, []);
\`\`\`

## Decision tree

- **Scroll-triggered reveal (no pinning)?** → \`gsap.from()\` with ScrollTrigger, \`start: "top 80%"\`
- **Pinned section with progressive steps?** → Timeline + ScrollTrigger with \`pin: true\`, \`scrub: 1\`
- **Parallax background?** → \`gsap.to()\` with ScrollTrigger, \`scrub: true\`
- **Horizontal scroll section?** → \`xPercent\` tween with \`pin: true\` and dynamic \`end\`
- **Component enter/exit?** → NOT GSAP — use Motion
- **Smooth scroll across the page?** → Lenis + ScrollTrigger sync
- **Responsive breakpoints?** → \`ScrollTrigger.matchMedia()\`

## Edge cases and gotchas

1. **React cleanup is mandatory** — Failing to \`ctx.revert()\` causes memory leaks and zombie ScrollTrigger instances. Always use \`gsap.context()\` with \`useLayoutEffect\`.
2. **Lenis on content-heavy pages** — Lenis overrides native scroll behavior. On documentation sites or long-form content, this hurts usability. Only use Lenis when smooth scroll is integral to the design concept.
3. **Pin spacing** — Pinning adds extra height to the page flow. If layout breaks, check \`pinSpacing: false\` or account for the added space.
4. **Touch devices** — Scrub-heavy sections feel different on touch. Test swipe velocity and consider simplifying the experience on mobile.
5. **Hot module replacement** — GSAP instances survive HMR in development. If animations double, ensure cleanup runs on HMR updates.
6. **GSAP license** — GSAP is free for most use. The "No Charge" license covers nearly all scenarios. The Business Green license is needed for tools that let customers build animations.

## Evaluation criteria

- [ ] \`gsap.registerPlugin(ScrollTrigger)\` called before any ScrollTrigger use
- [ ] All GSAP code wrapped in \`gsap.context()\` with cleanup in useLayoutEffect return
- [ ] Every pinned section justifies the scroll pause with meaningful content
- [ ] Touch/mobile scroll behavior tested on real devices
- [ ] Lenis used only when smooth scroll is integral to the concept (not on docs/dashboards)
- [ ] Total active ScrollTrigger instances per page are under 20
- [ ] Responsive behavior handled with \`ScrollTrigger.matchMedia()\`
- [ ] Animations target \`transform\` and \`opacity\` (not layout-triggering properties)`,
    agentDocs: {
      codex: `# Codex — GSAP + ScrollTrigger

## Environment
Sandboxed, file I/O only. No browser or scroll preview — ensure code is structurally valid and cleanup is present.

## When this skill is active
- Register ScrollTrigger plugin before any usage: \`gsap.registerPlugin(ScrollTrigger)\`.
- Always use \`gsap.context()\` in React \`useLayoutEffect\` for cleanup.
- Pin sections only when the scroll pause teaches the user something concrete.
- Pair with Lenis for smooth scroll sync only when the design concept requires it.
- Test touch/mobile scroll behavior before shipping.

## Tool usage
- Generate GSAP animation code in component files within \`components/\`.
- Place shared timeline factories in \`lib/gsap-timelines.ts\`.
- Place ScrollTrigger configuration objects in \`lib/scroll-configs.ts\`.

## Testing expectations
- Verify \`gsap.context()\` cleanup is present in every \`useLayoutEffect\` that creates GSAP instances.
- Ensure \`gsap.registerPlugin(ScrollTrigger)\` is called at module level, not inside a component.
- Build must succeed — GSAP is an external dependency, ensure it is in \`package.json\`.

## Common failure modes
- Missing \`ctx.revert()\` cleanup causing zombie ScrollTrigger instances.
- Lenis on content-heavy pages where native scroll is better.
- Pin spacing breaking layout — forgetting to account for added scroll height.
- Animating \`width\`, \`height\`, or \`top\` instead of \`transform\` properties.
- Not using \`ScrollTrigger.matchMedia()\` for responsive breakpoints.

## Output format
- Component files: one GSAP section per file.
- Timeline factories as exported functions.
- Register plugins at the module level, not inside effects.`,
      cursor: `# Cursor — GSAP + ScrollTrigger

## IDE context
GSAP does not have built-in TypeScript types in some versions. Install \`@types/gsap\` or use the bundled types from gsap v3.12+.

## Rules for code generation
- GSAP is for orchestration and scroll. Motion is for component states. Do not mix their concerns on the same element.
- Use \`scrub: true\` (or a number) for direct scroll-to-progress mapping.
- Timeline labels improve readability: \`tl.addLabel("sectionTwo")\`.
- \`ScrollTrigger.matchMedia()\` for responsive breakpoints — do not use CSS media queries to show/hide GSAP-animated elements.
- Kill all triggers on cleanup: \`ctx.revert()\` in the useLayoutEffect return.

## Code style
- Module-level plugin registration: \`gsap.registerPlugin(ScrollTrigger)\`.
- \`useLayoutEffect\` (not \`useEffect\`) for DOM-measuring animations.
- Refs for trigger elements, not string selectors (unless scoped by \`gsap.context\`).
- Timeline defaults for shared properties: \`gsap.timeline({ defaults: { ease: "power3.out" } })\`.

## Cursor features to leverage
- Inline completions for GSAP method chains.
- Multi-file editing to create animation + component in one pass.
- Terminal integration to run build and verify no GSAP import errors.

## Review checklist
- [ ] \`gsap.registerPlugin(ScrollTrigger)\` is at module level
- [ ] Every \`useLayoutEffect\` with GSAP has \`ctx.revert()\` in return
- [ ] Pin sections justify the scroll pause with content
- [ ] Responsive behavior uses \`ScrollTrigger.matchMedia()\`
- [ ] Animations use \`transform\` and \`opacity\`, not layout properties
- [ ] Lenis is only added when smooth scroll is integral to the design`,
      claude: `# Claude — GSAP + ScrollTrigger

## Interaction patterns
When a user asks about scroll animation or GSAP:
1. Determine if GSAP is the right tool (vs Motion for simple component animation).
2. Identify the scroll pattern: reveal, pin, scrub, parallax, or horizontal scroll.
3. Provide a complete code example with React cleanup.
4. Include responsive considerations with matchMedia.

## Response structure
1. **Assessment** — Is this a GSAP use case? Which scroll pattern?
2. **Plan** — Plugin setup → timeline construction → ScrollTrigger config → cleanup
3. **Implementation** — Complete React component with \`gsap.context()\` and cleanup
4. **Verification** — Cleanup present? Mobile tested? Pin justified?

## Chain-of-thought guidance
- Think about what the scroll animation teaches the user. If the answer is "nothing," the pin is not justified.
- Consider the mobile experience: does the scrub feel natural on touch?
- Check if Lenis is needed or if native scroll works fine for this use case.
- Evaluate total ScrollTrigger count on the page — stay under 20.

## Output formatting
- Always show the full \`useLayoutEffect\` with cleanup, not fragments.
- Include the \`gsap.registerPlugin()\` call in every example.
- Use timeline labels in complex sequences for readability.
- Add comments for ScrollTrigger \`start\`/\`end\` values explaining the trigger point.

## Constraints
- Never recommend GSAP for simple enter/exit or hover animations — those belong to Motion.
- Never omit \`gsap.context()\` cleanup in React examples.
- Never suggest Lenis for documentation or content-heavy pages.
- Always recommend responsive handling with \`matchMedia()\` when pin or scrub is involved.`,
      agents: `# AGENTS.md — GSAP + ScrollTrigger

## Purpose
Ensure all scroll-driven animations are well-structured, cleaned up, justified, and performant across devices.

## Review checklist
1. Is \`gsap.registerPlugin(ScrollTrigger)\` called at module level before any use?
2. Is every GSAP animation inside \`gsap.context()\` with \`ctx.revert()\` in the cleanup?
3. Does every pinned section justify the scroll pause with meaningful, progressive content?
4. Is touch/mobile scroll behavior tested on real devices (not just DevTools)?
5. Is Lenis used only when smooth scroll is integral (not on docs or content-heavy pages)?
6. Are responsive breakpoints handled with \`ScrollTrigger.matchMedia()\`?
7. Are animated properties limited to \`transform\` and \`opacity\`?
8. Is the total ScrollTrigger count per page under 20?

## Quality gates
- **Cleanup verification**: grep for \`useLayoutEffect\` + \`gsap\` and confirm every instance has \`ctx.revert()\`.
- **Pin justification**: every pin section should have a content design rationale.
- **Mobile parity**: scroll experience must be tested and acceptable on touch devices.

## Related skills
- Framer Motion — for component-level animation (enter/exit, layout, gestures)
- Frontend Frontier — for motion layer strategy
- Web Performance — for animation profiling
- React Three Fiber — when GSAP coordinates with 3D scenes

## Escalation criteria
- If the animation involves 3D scene coordination, escalate to React Three Fiber.
- If frame drops occur during scrub, escalate to Web Performance for profiling.
- If the page needs component-level animation, redirect to Framer Motion.`
    }
  },

  // -----------------------------------------------------------------------
  // 4. React Three Fiber
  // -----------------------------------------------------------------------
  {
    slug: "react-three-fiber",
    title: "React Three Fiber",
    description:
      "Declarative 3D scenes in React using R3F, drei helpers, and the Three.js ecosystem for product configurators, portfolios, and immersive experiences.",
    category: "frontend",
    accent: "signal-red",
    tags: ["3d", "react", "threejs", "webgl", "r3f"],
    body: `# React Three Fiber

Build declarative 3D scenes with React. React Three Fiber (R3F) is a React renderer for Three.js — every Three.js object becomes a JSX element. Combined with drei (a companion library of pre-built helpers), R3F makes it practical to ship production 3D inside React apps: product configurators, hero scenes, data visualizations, interactive portfolios, and immersive experiences.

## When to use

- Product configurators where users customize materials, colors, or parts in 3D
- Hero scenes with camera movement, environment reflections, or atmospheric effects
- Interactive portfolio pieces or case study showcases
- Data visualizations that benefit from 3D spatial layout
- Any 3D that lives inside a React application and shares React state
- Loading and displaying glTF/GLB 3D models from designers or asset pipelines

## When NOT to use

- Simple decorative depth (parallax tilt, pseudo-3D illustrations) — use lightweight-3d-effects or CSS transforms
- Non-React projects — use plain Three.js (threejs-webgl skill)
- Game-engine-level physics, collisions, and entity systems — consider Babylon.js or PlayCanvas
- When the 3D adds no value and a well-shot photo or illustration would work better
- Server-side rendering requirements — R3F renders on the client only

## Core concepts

### Canvas

The root component that creates a WebGL renderer, scene, and camera:

\`\`\`tsx
import { Canvas } from "@react-three/fiber";

<Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
  <ambientLight intensity={0.5} />
  <directionalLight position={[10, 10, 5]} intensity={1} />
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="hotpink" />
  </mesh>
</Canvas>
\`\`\`

### useFrame

Per-frame updates. Never call \`setState\` here — mutate refs directly:

\`\`\`tsx
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function SpinningBox() {
  const meshRef = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.5;
  });
  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}
\`\`\`

### Model loading with useGLTF

\`\`\`tsx
import { useGLTF } from "@react-three/drei";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

useGLTF.preload("/models/product.glb");
\`\`\`

### Environment and lighting with drei

\`\`\`tsx
import { Environment, ContactShadows } from "@react-three/drei";

<Canvas>
  <Environment preset="city" />
  <ContactShadows position={[0, -0.5, 0]} opacity={0.5} blur={2} />
  <Model url="/models/product.glb" />
</Canvas>
\`\`\`

### Post-processing

\`\`\`tsx
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

<EffectComposer>
  <Bloom luminanceThreshold={0.9} intensity={0.5} />
  <Vignette offset={0.3} darkness={0.5} />
</EffectComposer>
\`\`\`

## Workflow

### 1. Set up the Canvas

Wrap your 3D content in \`<Canvas>\`. Set camera position, field of view, and \`dpr\` (device pixel ratio) for quality vs performance.

### 2. Add lighting and environment

Use \`<Environment preset="..." />\` from drei for realistic reflections. Add a directional light for shadows and an ambient light for fill.

### 3. Load models

Use \`useGLTF\` for glTF/GLB models. Always wrap in \`<Suspense>\` with a fallback. Preload models with \`useGLTF.preload()\`.

### 4. Add interaction

Use drei's interaction helpers or R3F's built-in pointer events:

\`\`\`tsx
<mesh
  onPointerOver={() => setHovered(true)}
  onPointerOut={() => setHovered(false)}
  onClick={() => setActive(!active)}
>
  <meshStandardMaterial color={hovered ? "lightblue" : "white"} />
</mesh>
\`\`\`

### 5. Profile performance

Install r3f-perf and monitor during development:

\`\`\`tsx
import { Perf } from "r3f-perf";

<Canvas>
  {process.env.NODE_ENV === "development" && <Perf position="top-left" />}
  {/* scene content */}
</Canvas>
\`\`\`

### 6. Provide fallbacks for SSR and slow connections

R3F is client-only. Show a poster image or skeleton while the 3D loads:

\`\`\`tsx
import dynamic from "next/dynamic";

const Scene3D = dynamic(() => import("./Scene3D"), {
  ssr: false,
  loading: () => <img src="/poster.jpg" alt="Product preview" />,
});
\`\`\`

## Examples

### Example 1 — Product showcase with orbit controls

\`\`\`tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

function ProductScene() {
  const { scene } = useGLTF("/models/sneaker.glb");
  return (
    <Canvas camera={{ position: [0, 1, 3], fov: 45 }} dpr={[1, 2]}>
      <Suspense fallback={null}>
        <Environment preset="studio" />
        <primitive object={scene} />
        <OrbitControls enablePan={false} minDistance={2} maxDistance={5} />
      </Suspense>
    </Canvas>
  );
}
\`\`\`

### Example 2 — Floating text with bloom

\`\`\`tsx
import { Text, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function HeroText() {
  return (
    <>
      <Float speed={2} floatIntensity={0.5}>
        <Text fontSize={1.5} color="white" font="/fonts/display.woff">
          Hello World
        </Text>
      </Float>
      <EffectComposer>
        <Bloom luminanceThreshold={0.8} intensity={0.3} />
      </EffectComposer>
    </>
  );
}
\`\`\`

### Example 3 — Instanced geometry for many objects

\`\`\`tsx
import { Instances, Instance } from "@react-three/drei";

function ParticleField({ count = 500 }: { count?: number }) {
  const positions = useMemo(() =>
    Array.from({ length: count }, () => [
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
    ] as [number, number, number]),
  [count]);

  return (
    <Instances limit={count}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="white" />
      {positions.map((pos, i) => (
        <Instance key={i} position={pos} />
      ))}
    </Instances>
  );
}
\`\`\`

## Decision tree

- **3D product viewer in React?** → R3F + useGLTF + OrbitControls
- **Atmospheric hero scene?** → R3F + Environment + post-processing
- **Many identical objects?** → \`<Instances>\` from drei for performance
- **Animated 3D object?** → useFrame with ref mutation (not setState)
- **Need SSR?** → Dynamic import with \`ssr: false\` and a poster fallback
- **Non-React project?** → Use plain Three.js (threejs-webgl skill)
- **Simple depth effect, no real 3D?** → Use CSS transforms or lightweight-3d-effects

## Edge cases and gotchas

1. **Never setState in useFrame** — This triggers a React re-render 60 times per second. Mutate refs directly for per-frame updates.
2. **Memory leaks from undisposed assets** — Geometries, materials, and textures must be disposed on unmount. Use \`useEffect\` cleanup or drei's \`useGLTF\` which handles cleanup automatically.
3. **SSR mismatch** — R3F uses WebGL, which does not exist on the server. Always use dynamic imports with \`ssr: false\` in Next.js.
4. **Large model files** — GLB files over 5MB cause slow loads. Use \`gltf-transform\` or Draco compression to optimize. Show a progress indicator during load.
5. **DPR and mobile performance** — Setting \`dpr={[1, 2]}\` renders at device pixel ratio up to 2x. On low-end mobile, cap at 1: \`dpr={[1, 1.5]}\`.
6. **Z-fighting with overlapping surfaces** — When two surfaces are nearly coplanar, flickering occurs. Offset one surface by a tiny amount or use \`polygonOffset\`.

## Evaluation criteria

- [ ] useFrame never calls setState — refs are mutated directly
- [ ] All geometries, materials, and textures are disposed on unmount
- [ ] Models are wrapped in \`<Suspense>\` with a loading fallback
- [ ] Models are preloaded with \`useGLTF.preload()\`
- [ ] SSR is handled via dynamic import with \`ssr: false\`
- [ ] Performance is profiled with r3f-perf during development
- [ ] Instanced meshes are used for repeated geometry
- [ ] DPR is capped appropriately for target devices
- [ ] A static poster image is shown before 3D hydrates`,
    agentDocs: {
      codex: `# Codex — React Three Fiber

## Environment
Sandboxed, file I/O only. No WebGL preview — ensure code is structurally correct and builds without errors.

## When this skill is active
- Use \`<Canvas>\` from \`@react-three/fiber\`, helpers from \`@react-three/drei\`.
- Never call setState inside useFrame — mutate refs directly.
- Use \`useGLTF\` for model loading with \`<Suspense>\` fallback.
- Dispose geometries and materials on unmount to prevent memory leaks.
- Provide a static poster/screenshot for SSR and slow connections.

## Tool usage
- Place 3D scene components in \`components/3d/\` or \`components/scenes/\`.
- Place custom hooks (useFrame wrappers, model loaders) in \`hooks/\`.
- Place model assets in \`public/models/\`.
- Use dynamic import with \`ssr: false\` in Next.js page components.

## Testing expectations
- Build must succeed — verify \`@react-three/fiber\` and \`@react-three/drei\` are in dependencies.
- Static render (SSR pass) should show the fallback, not crash on missing WebGL.
- useFrame callbacks should be tested for ref mutation, not setState calls.

## Common failure modes
- Calling setState in useFrame causing 60fps re-renders.
- Missing Suspense boundary around model-loading components.
- Not disposing assets on unmount — causes memory leaks over navigation.
- SSR crash from missing WebGL context — must use dynamic import.
- Overloading the scene with unoptimized models (10MB+ GLB files).

## Output format
- Component files: one scene per file in \`components/3d/\`.
- Model preloading calls at the bottom of the file.
- Dynamic import wrapper in the page-level component.`,
      cursor: `# Cursor — React Three Fiber

## IDE context
R3F JSX elements map to Three.js objects. Cursor provides autocompletion for Three.js properties as JSX props (e.g., \`<mesh position={[x,y,z]}>\`).

## Rules for code generation
- All Three.js objects are available as lowercase JSX: \`<mesh>\`, \`<boxGeometry>\`, \`<meshStandardMaterial>\`.
- Use drei helpers over raw Three.js when available (OrbitControls, Environment, Text, Float, etc.).
- Camera, scene, and renderer are managed by \`<Canvas>\` automatically — do not create them manually.
- Use \`useThree()\` to access the renderer, camera, or scene imperatively when needed.
- Instance repeated geometry with \`<Instances>\` from drei for performance.

## Code style
- Typed refs: \`useRef<Mesh>(null)\`, \`useRef<Group>(null)\`.
- Props interfaces for scene components with explicit Three.js types.
- Model components export a preload call: \`MyModel.preload = () => useGLTF.preload(url)\`.
- useFrame delta parameter for frame-rate-independent animation.

## Cursor features to leverage
- TypeScript autocompletion for Three.js props on JSX elements.
- Go-to-definition on drei helpers to understand available props.
- Multi-file editing to create scene component + page wrapper simultaneously.

## Review checklist
- [ ] No setState inside useFrame
- [ ] Suspense boundary present around model loading
- [ ] Assets disposed on unmount
- [ ] SSR handled with dynamic import (\`ssr: false\`)
- [ ] Performance profiled with r3f-perf
- [ ] Instanced meshes for repeated geometry`,
      claude: `# Claude — React Three Fiber

## Interaction patterns
When a user asks about 3D in React:
1. Confirm R3F is the right choice (vs plain Three.js, Babylon.js, or lightweight effects).
2. Identify the scene type: product viewer, hero scene, data visualization, or interactive experience.
3. Provide a complete Canvas setup with lighting, model loading, and interaction.
4. Include performance and SSR considerations.

## Response structure
1. **Assessment** — Is R3F the right tool? What scene type is needed?
2. **Plan** — Canvas setup → lighting → model/geometry → interaction → post-processing → SSR fallback
3. **Implementation** — Complete component with Suspense, useFrame (if needed), and drei helpers
4. **Verification** — Performance profiled? SSR handled? Assets disposable?

## Chain-of-thought guidance
- Think about what the 3D adds to the user experience. If a 2D image would suffice, say so.
- Consider the loading experience: what does the user see while the 3D loads?
- Think about mobile: is the scene performant on mid-range devices? Can DPR be capped?
- Evaluate if post-processing (Bloom, Vignette) adds value or just adds cost.

## Output formatting
- Complete Canvas setup in every example — not fragments.
- Show model loading with Suspense fallback.
- Include TypeScript types for refs and props.
- Show the dynamic import pattern for Next.js.

## Constraints
- Never suggest R3F for simple parallax or tilt effects.
- Always include a Suspense fallback for model loading.
- Always show the dynamic import pattern when Next.js is involved.
- Never omit dispose cleanup for custom geometries and materials.`,
      agents: `# AGENTS.md — React Three Fiber

## Purpose
Ensure all 3D scenes in React are performant, accessible (with fallbacks), properly cleaned up, and SSR-safe.

## Review checklist
1. Is useFrame avoiding setState calls (refs mutated directly)?
2. Are all geometries, materials, and textures disposed on unmount?
3. Is there a \`<Suspense>\` fallback around model-loading components?
4. Are models preloaded with \`useGLTF.preload()\`?
5. Is SSR handled via dynamic import with \`ssr: false\`?
6. Is a static poster image shown before 3D hydrates?
7. Is performance profiled with r3f-perf during development?
8. Are instanced meshes used for repeated geometry (>10 instances)?

## Quality gates
- **Frame rate**: scene must maintain 50+ fps on target device during interaction.
- **Load time**: GLB models should be under 2MB (compressed). Use gltf-transform or Draco for larger models.
- **SSR safety**: the build must not crash during server-side rendering.
- **Fallback quality**: the poster image should be a realistic representation of the loaded 3D.

## Related skills
- Frontend Frontier — for art direction and motion layer strategy
- GSAP + ScrollTrigger — when 3D coordinates with scroll choreography
- Web Performance — for profiling and optimization
- Tailwind Design System — for the 2D UI surrounding the 3D scene

## Escalation criteria
- If the scene requires game-engine features (physics, collision, entity systems), consider Babylon.js.
- If the 3D is purely decorative, consider lightweight-3d-effects instead.
- If frame rate drops below 30fps after optimization, the scene scope may need reduction.`
    }
  },

  // -----------------------------------------------------------------------
  // 5. Tailwind Design System
  // -----------------------------------------------------------------------
  {
    slug: "tailwind-design-system",
    title: "Tailwind Design System",
    description:
      "Token-driven design systems with Tailwind CSS v4 @theme, CSS custom properties, and systematic spacing, color, and typography scales.",
    category: "frontend",
    accent: "signal-red",
    tags: ["tailwind", "design-system", "tokens", "css", "theming"],
    body: `# Tailwind Design System

Build and maintain a tokenized design system using Tailwind CSS v4's native \`@theme\` directive and CSS custom properties. Tokens enforce design decisions so that spacing, color, radii, shadows, and typography remain consistent across every component — without relying on per-developer taste or memory.

## When to use

- Starting a new design system or component library on Tailwind CSS v4
- Migrating from arbitrary Tailwind classes to a token-driven approach
- Adding dark mode, theming, or brand variants to an existing Tailwind project
- Auditing an existing codebase for design inconsistency (radius drift, color proliferation, spacing anarchy)
- Defining a type scale with fluid sizing using \`clamp()\`
- Setting up shadow, blur, and motion tokens for a cohesive depth system

## When NOT to use

- Projects locked to Tailwind CSS v3 without upgrade path — \`@theme\` is v4 only
- Quick prototypes where speed matters more than consistency — use default Tailwind utilities
- CSS-in-JS systems (Emotion, styled-components) — tokens transport differently there
- Design work in Figma without a code component — define tokens in Figma variables first, then mirror here

## Core concepts

### Token categories

Every design system needs tokens in these categories:

| Category | Token prefix | Examples |
|----------|-------------|----------|
| Color | \`--color-\` | \`--color-surface\`, \`--color-accent\`, \`--color-text-primary\` |
| Spacing | \`--space-\` | \`--space-xs\` (0.25rem) through \`--space-4xl\` (8rem) |
| Radii | \`--radius-\` | \`--radius-sm\`, \`--radius-card\`, \`--radius-pill\` |
| Shadow | \`--shadow-\` | \`--shadow-subtle\`, \`--shadow-elevated\`, \`--shadow-overlay\` |
| Typography | \`--font-\` | \`--font-display\`, \`--font-sans\`, \`--font-mono\` |
| Type scale | \`--text-\` | \`--text-xs\` through \`--text-6xl\` (with clamp) |
| Motion | \`--duration-\`, \`--ease-\` | \`--duration-fast\`, \`--ease-out-expo\` |
| Z-index | \`--z-\` | \`--z-dropdown\`, \`--z-modal\`, \`--z-toast\` |
| Blur | \`--blur-\` | \`--blur-subtle\`, \`--blur-overlay\` |

### Concentric radii rule

Nested surfaces must preserve concentric radii: **outer radius = inner radius + padding**. If a card has \`border-radius: 1rem\` and \`padding: 0.75rem\`, inner elements should have \`border-radius: 0.25rem\`.

### OKLCH color authoring

OKLCH is perceptually uniform — equal changes in lightness produce equal visual changes. Author all custom colors in OKLCH:

\`\`\`css
--color-accent: oklch(0.65 0.25 29);
--color-accent-hover: oklch(0.60 0.25 29);
--color-accent-subtle: oklch(0.65 0.15 29 / 0.15);
\`\`\`

## Workflow

### 1. Define the complete @theme block

\`\`\`css
@theme {
  /* Color — semantic palette in OKLCH */
  --color-surface: oklch(0.985 0.005 260);
  --color-surface-elevated: oklch(1 0 0);
  --color-surface-sunken: oklch(0.96 0.005 260);
  --color-accent: oklch(0.65 0.25 29);
  --color-accent-hover: oklch(0.58 0.25 29);
  --color-accent-subtle: oklch(0.65 0.15 29 / 0.12);
  --color-text-primary: oklch(0.13 0.01 260);
  --color-text-secondary: oklch(0.45 0.01 260);
  --color-text-tertiary: oklch(0.62 0.01 260);
  --color-border: oklch(0.88 0.005 260);
  --color-border-strong: oklch(0.78 0.005 260);

  /* Spacing — 4px base */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2.5rem;
  --space-2xl: 4rem;
  --space-3xl: 6rem;
  --space-4xl: 8rem;

  /* Radii */
  --radius-xs: 0.25rem;
  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-card: 1rem;
  --radius-lg: 1.25rem;
  --radius-pill: 9999px;

  /* Shadow — layered depth */
  --shadow-subtle: 0 1px 2px oklch(0 0 0 / 0.04);
  --shadow-elevated: 0 4px 12px oklch(0 0 0 / 0.08), 0 1px 3px oklch(0 0 0 / 0.04);
  --shadow-overlay: 0 12px 40px oklch(0 0 0 / 0.12), 0 4px 12px oklch(0 0 0 / 0.06);

  /* Type — font families */
  --font-display: "Instrument Serif", serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Type scale — fluid with clamp */
  --text-xs: clamp(0.7rem, 0.65rem + 0.2vw, 0.75rem);
  --text-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
  --text-base: clamp(0.9rem, 0.85rem + 0.3vw, 1rem);
  --text-lg: clamp(1.05rem, 0.95rem + 0.5vw, 1.25rem);
  --text-xl: clamp(1.2rem, 1rem + 0.8vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.2rem + 1.2vw, 2rem);
  --text-3xl: clamp(1.8rem, 1.4rem + 1.6vw, 2.5rem);
  --text-4xl: clamp(2.2rem, 1.6rem + 2vw, 3.25rem);
  --text-5xl: clamp(2.8rem, 2rem + 2.5vw, 4rem);
  --text-6xl: clamp(3.5rem, 2.5rem + 3vw, 5rem);

  /* Motion */
  --duration-instant: 80ms;
  --duration-fast: 120ms;
  --duration-normal: 250ms;
  --duration-slow: 500ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Z-index */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-toast: 400;
  --z-tooltip: 500;

  /* Blur */
  --blur-subtle: 4px;
  --blur-medium: 12px;
  --blur-overlay: 24px;
}
\`\`\`

### 2. Add dark mode tokens

\`\`\`css
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: oklch(0.14 0.005 260);
    --color-surface-elevated: oklch(0.18 0.005 260);
    --color-surface-sunken: oklch(0.10 0.005 260);
    --color-text-primary: oklch(0.93 0.005 260);
    --color-text-secondary: oklch(0.68 0.005 260);
    --color-text-tertiary: oklch(0.52 0.005 260);
    --color-border: oklch(0.25 0.005 260);
    --color-border-strong: oklch(0.35 0.005 260);
    --shadow-subtle: 0 1px 2px oklch(0 0 0 / 0.2);
    --shadow-elevated: 0 4px 12px oklch(0 0 0 / 0.3), 0 1px 3px oklch(0 0 0 / 0.2);
  }
}
\`\`\`

### 3. Use tokens as Tailwind utilities in components

\`\`\`tsx
<div className="bg-surface rounded-card p-space-lg shadow-elevated">
  <h2 className="font-display text-text-primary text-2xl text-balance">
    Heading
  </h2>
  <p className="mt-space-sm text-text-secondary text-base">
    Body text using token-based spacing and color.
  </p>
</div>
\`\`\`

### 4. Component-level token usage

\`\`\`tsx
<button className="bg-accent text-surface rounded-sm px-space-md py-space-sm text-sm font-sans transition-colors duration-fast hover:bg-accent-hover">
  Call to action
</button>
\`\`\`

## Examples

### Example 1 — Card with concentric radii

\`\`\`tsx
<div className="rounded-card bg-surface-elevated p-space-md shadow-elevated">
  <img className="rounded-sm w-full aspect-video object-cover" src="/hero.jpg" alt="" />
  <div className="mt-space-sm">
    <h3 className="font-sans text-lg font-semibold text-text-primary">Card title</h3>
    <p className="mt-space-xs text-sm text-text-secondary">Card description</p>
  </div>
</div>
\`\`\`

### Example 2 — Metric display with tabular-nums

\`\`\`tsx
<div className="font-mono tabular-nums text-4xl text-accent">
  $12,450.00
</div>
\`\`\`

## Decision tree

- **Starting a new project?** → Define the full \`@theme\` block first, before any component code
- **Existing project with arbitrary values?** → Audit, create token map, migrate incrementally
- **Need dark mode?** → Override semantic tokens in \`prefers-color-scheme: dark\`
- **Need brand theming?** → Use CSS custom property overrides per theme class
- **Need fluid type?** → Use \`clamp()\` in the type scale tokens

## Edge cases and gotchas

1. **Tailwind v4 only** — The \`@theme\` directive does not exist in Tailwind v3. For v3 projects, use \`theme.extend\` in \`tailwind.config.ts\` instead.
2. **OKLCH browser support** — OKLCH has ~95% global support. For legacy browsers, provide an HSL fallback above the OKLCH declaration.
3. **Token proliferation** — Resist creating one-off tokens. If a value is used once, it does not need a token. Tokens are for repeated decisions.
4. **Concentric radii math** — When nesting rounded elements, manually calculate inner radius = outer radius - padding. Tailwind does not enforce this automatically.
5. **Dark mode flash** — If using \`prefers-color-scheme\`, the initial render may flash light before dark applies. Use a script in \`<head>\` to set a class before first paint.

## Evaluation criteria

- [ ] All colors, spacing, radii, shadows, and type sizes use tokens from \`@theme\`
- [ ] Color palette is limited: 3 active colors max plus neutrals
- [ ] All custom colors authored in OKLCH
- [ ] Concentric radii preserved on nested surfaces
- [ ] Type scale uses \`clamp()\` for fluid sizing
- [ ] Dark mode tokens are semantic overrides, not separate color names
- [ ] \`tabular-nums\` used for metrics, prices, and dynamic numbers
- [ ] \`text-wrap: balance\` used for headings
- [ ] No raw hex values or arbitrary Tailwind classes in design-critical positions
- [ ] Shadow tokens create layered depth (not single hard shadows)`,
    agentDocs: {
      codex: `# Codex — Tailwind Design System

## Environment
Sandboxed, file I/O only. Tailwind v4 CSS is processed at build time — generate valid \`@theme\` blocks and verify via build.

## When this skill is active
- Define tokens in \`@theme\` block in the global CSS file — never as arbitrary Tailwind values.
- Use OKLCH for all custom color authoring.
- Keep primary palette to 3 active colors plus neutrals.
- Enforce concentric radii on nested surfaces.
- Use \`tabular-nums\` for all numeric content (prices, dates, metrics).

## Tool usage
- Primary token file: \`app/globals.css\` (or wherever the global stylesheet lives).
- One \`@theme\` block per project — do not split tokens across multiple files.
- Component files reference tokens via Tailwind utilities: \`bg-surface\`, \`rounded-card\`, etc.
- Dark mode overrides go in a \`prefers-color-scheme: dark\` media query in the same file.

## Testing expectations
- Run \`pnpm build\` to verify all token references resolve to valid CSS.
- Grep for raw hex values (\`#[0-9a-f]\`) in TSX files — flag any in design-critical positions.
- Verify concentric radii on any component with nested rounded surfaces.

## Common failure modes
- Using \`@theme\` syntax in a Tailwind v3 project (it won't work).
- Creating one-off tokens for values used only once (token proliferation).
- Forgetting dark mode overrides for semantic tokens.
- OKLCH values with incorrect syntax (missing space between components).
- Concentric radii violations: inner elements with larger radius than outer.

## Output format
- Global CSS file with complete \`@theme\` block.
- Component files using token-based Tailwind utilities.
- Dark mode overrides in the same global CSS file.`,
      cursor: `# Cursor — Tailwind Design System

## IDE context
Tailwind v4 provides autocompletion for \`@theme\` tokens as utility classes. Token names become class names: \`--color-surface\` → \`bg-surface\`.

## Rules for code generation
- Tokens live in the \`@theme\` block in the global CSS file.
- Access tokens as Tailwind utilities: \`bg-surface\`, \`text-accent\`, \`rounded-card\`, \`p-space-md\`.
- Runtime CSS variables work alongside \`@theme\` for dynamic theming (e.g., theme switching).
- Never use raw hex, HSL, or arbitrary Tailwind values (\`bg-[#ff0000]\`) for design-critical properties.
- Shadow tokens should create layered depth with multiple shadow layers.

## Code style
- \`@theme\` block at the top of the global CSS file, above any component styles.
- Dark mode overrides in \`@media (prefers-color-scheme: dark)\` block.
- Token names use kebab-case with category prefix: \`--color-\`, \`--space-\`, \`--radius-\`.
- Comments within \`@theme\` to group token categories.

## Cursor features to leverage
- Tailwind CSS IntelliSense extension provides autocompletion for token-based utilities.
- Color decorators show OKLCH values as swatches in the editor.
- Multi-cursor editing to rename token references across components.
- CSS preview in Cursor to verify token resolution.

## Review checklist
- [ ] All colors, spacing, and radii values trace back to \`@theme\` tokens
- [ ] Color palette is limited: 3 active colors plus neutrals
- [ ] OKLCH used for all custom color definitions
- [ ] Concentric radii preserved on nested elements
- [ ] Dark mode tokens override semantically (same token names, different values)
- [ ] No raw hex or arbitrary Tailwind values in design-critical positions`,
      claude: `# Claude — Tailwind Design System

## Interaction patterns
When a user asks about design tokens or Tailwind setup:
1. Ask about the project's Tailwind version (v3 vs v4 — \`@theme\` is v4 only).
2. Ask about existing brand colors, fonts, and design constraints.
3. Provide a complete \`@theme\` block covering all token categories.
4. Show component examples using the defined tokens.

## Response structure
1. **Assessment** — What tokens are needed? Is the project on Tailwind v4?
2. **Plan** — Token categories → \`@theme\` block → dark mode → component usage
3. **Implementation** — Complete \`@theme\` block + 2-3 component examples using tokens
4. **Verification** — Are all token categories covered? Is the palette limited?

## Chain-of-thought guidance
- Think about the visual hierarchy: which colors are primary, secondary, tertiary?
- Consider the spacing rhythm: is 4px or 8px the base unit?
- Evaluate whether the type scale needs fluid sizing or fixed breakpoints.
- Check if concentric radii are mathematically consistent.

## Output formatting
- Show the complete \`@theme\` block in a CSS code fence.
- Show dark mode overrides separately.
- Show component usage in TSX code fences with Tailwind utilities.
- Use a table to explain each token category and its purpose.

## Constraints
- Never suggest arbitrary Tailwind values for design-critical properties.
- Never use hex colors when OKLCH is available.
- Never create one-off tokens for values used only once.
- Always include all 8+ token categories in a complete system.`,
      agents: `# AGENTS.md — Tailwind Design System

## Purpose
Ensure the design system is token-driven, consistent, and maintainable with no arbitrary values or drift.

## Review checklist
1. Are all color, spacing, radii, shadow, and type values defined as tokens in \`@theme\`?
2. Is the color palette limited to 3 active colors plus neutrals?
3. Are all custom colors authored in OKLCH?
4. Are concentric radii preserved on nested rounded surfaces?
5. Does the type scale use \`clamp()\` for fluid sizing?
6. Are dark mode tokens semantic overrides (same names, different values)?
7. Is \`tabular-nums\` applied to metrics, prices, and dynamic numbers?
8. Are there zero raw hex values or arbitrary Tailwind classes in design-critical positions?

## Quality gates
- **Token coverage**: grep for \`#[0-9a-f]\` and \`bg-\\[\` in TSX files — zero matches expected.
- **Concentric radii**: manually check any nested rounded components.
- **Dark mode**: toggle system preference and verify all surfaces, text, and borders adapt.
- **Fluid type**: resize browser from 320px to 1440px and verify type scales smoothly.

## Related skills
- Frontend Frontier — for art direction and visual thesis
- Framer Motion — for motion token usage
- Responsive Layouts — for fluid spacing and container queries
- Web Performance — for font loading and CSS optimization

## Escalation criteria
- If the project is on Tailwind v3, migrate to v4 first or use \`theme.extend\` in config.
- If brand colors are provided in hex, convert to OKLCH before defining tokens.
- If the token system exceeds 100 tokens, audit for proliferation.`
    }
  },

  // -----------------------------------------------------------------------
  // 6. Web Performance
  // -----------------------------------------------------------------------
  {
    slug: "web-performance",
    title: "Lighthouse Web Performance",
    description:
      "Core Web Vitals via Google Lighthouse and Chrome DevTools: LCP, CLS, INP, bundle analysis, image optimization, caching strategies, and runtime profiling.",
    category: "frontend",
    accent: "signal-red",
    tags: ["performance", "vitals", "lcp", "cls", "optimization"],
    body: `# Lighthouse Web Performance

Optimize for the metrics that matter: LCP (Largest Contentful Paint), CLS (Cumulative Layout Shift), and INP (Interaction to Next Paint). Every millisecond of delay and every layout shift costs engagement, conversion, and search ranking. This skill covers identification, diagnosis, and concrete fixes using Chrome DevTools, Lighthouse, Next.js tooling, and Web APIs.

## When to use

- Lighthouse score is below 90 and you need to identify and fix the bottlenecks
- LCP is above 2.5s and the hero content loads slowly
- CLS is above 0.1 and the page layout shifts as content loads
- INP is above 200ms and interactions feel sluggish
- After adding a new dependency and bundle size needs auditing
- Before a production launch to establish a performance baseline

## When NOT to use

- Pure design or art direction decisions — use Frontend Frontier
- Accessibility audits — use Accessible UI (Lighthouse a11y score is only a starting point)
- Build system configuration unrelated to bundle output — use framework-specific tooling
- Backend API performance — this skill covers frontend/client metrics only

## Core concepts

### Core Web Vitals targets

| Metric | Good | Needs work | Poor | Measures |
|--------|------|------------|------|----------|
| LCP | < 2.5s | 2.5–4s | > 4s | Loading performance (largest visible element) |
| CLS | < 0.1 | 0.1–0.25 | > 0.25 | Visual stability (unexpected layout shifts) |
| INP | < 200ms | 200–500ms | > 500ms | Responsiveness (time from input to visual update) |

### The rendering pipeline

Browser → Parse HTML → Build DOM → Resolve CSS → Layout → Paint → Composite

Optimize at each stage: reduce blocking resources (Parse), simplify selectors (CSS), avoid forced reflows (Layout), animate composited properties (Composite).

## Workflow

### 1. Identify the LCP element

Open Chrome DevTools → Performance tab → record a page load → find the LCP marker. Common LCP elements: hero image, largest heading, background video poster.

### 2. Optimize the LCP element

\`\`\`tsx
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Product hero"
  width={1200}
  height={630}
  priority
  sizes="100vw"
  className="w-full h-auto"
/>
\`\`\`

For non-Next.js projects, use manual preloading:

\`\`\`html
<link rel="preload" as="image" href="/hero.jpg" fetchpriority="high" />
\`\`\`

### 3. Prevent CLS

Set explicit dimensions on all images and videos:

\`\`\`tsx
<img src="/photo.jpg" alt="" width={800} height={600} className="w-full h-auto" />
<video width={1280} height={720} poster="/poster.jpg" />
\`\`\`

Reserve space for async content with skeleton placeholders:

\`\`\`tsx
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-card bg-surface-sunken" style={{ height: 200 }} />
  );
}
\`\`\`

### 4. Optimize font loading

\`\`\`tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});
\`\`\`

### 5. Code-split heavy dependencies

\`\`\`tsx
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./HeavyChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

const MarkdownRenderer = dynamic(() => import("./MarkdownRenderer"));
\`\`\`

### 6. Move heavy computation to Web Workers

\`\`\`tsx
const worker = new Worker(new URL("./search-worker.ts", import.meta.url));

function search(query: string): Promise<Result[]> {
  return new Promise((resolve) => {
    worker.postMessage({ type: "search", query });
    worker.onmessage = (e) => resolve(e.data.results);
  });
}
\`\`\`

### 7. Improve INP with startTransition

\`\`\`tsx
import { startTransition, useState } from "react";

function FilterPanel({ onFilter }: { onFilter: (q: string) => void }) {
  const [query, setQuery] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    startTransition(() => onFilter(value));
  }

  return <input value={query} onChange={handleChange} />;
}
\`\`\`

### 8. Audit bundle size

\`\`\`bash
ANALYZE=true next build
# or
npx source-map-explorer .next/static/chunks/*.js
\`\`\`

## Examples

### Example 1 — Responsive image with AVIF + WebP fallback

\`\`\`html
<picture>
  <source srcset="/hero.avif" type="image/avif" />
  <source srcset="/hero.webp" type="image/webp" />
  <img src="/hero.jpg" alt="Hero" width="1200" height="630" fetchpriority="high" />
</picture>
\`\`\`

### Example 2 — Virtualized long list

\`\`\`tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }: { items: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  return (
    <div ref={parentRef} style={{ height: 400, overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div key={row.key} style={{ height: row.size, transform: \`translateY(\${row.start}px)\` }}>
            {items[row.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
\`\`\`

## Decision tree

- **LCP > 2.5s?** → Identify LCP element → preload with \`priority\` or \`fetchpriority="high"\`
- **CLS > 0.1?** → Set explicit image/video dimensions → add skeleton placeholders
- **INP > 200ms?** → \`startTransition\` for non-urgent updates → debounce handlers → virtualize lists
- **Bundle too large?** → Audit with \`source-map-explorer\` → dynamic import heavy deps → tree-shake
- **Fonts cause flash?** → Use \`next/font\` with \`display: swap\` → preload critical font files
- **Heavy computation on main thread?** → Move to Web Worker

## Edge cases and gotchas

1. **Third-party scripts** — Analytics, chat widgets, and ad scripts are often the biggest LCP blockers. Load them with \`async\` or \`defer\` and after the critical path.
2. **Image format support** — AVIF offers 50% smaller files than WebP but encoding is slower. Use a build-time pipeline or CDN transformation.
3. **Font subsetting** — Loading all Unicode ranges for a display font wastes bandwidth. Subset to Latin (or your target scripts) only.
4. **CLS from web fonts** — Custom fonts with different metrics than the fallback cause layout shift. Use \`size-adjust\` on the fallback \`@font-face\` to match dimensions.
5. **Hydration cost** — Large React trees take time to hydrate. Use React Server Components to reduce the client bundle and hydration work.
6. **Premature optimization** — Profile before optimizing. \`startTransition\` on an already-fast handler adds complexity for no gain.

## Evaluation criteria

- [ ] LCP element is identified and preloaded with \`priority\` or \`fetchpriority="high"\`
- [ ] All images and videos have explicit \`width\` and \`height\` attributes
- [ ] Skeleton placeholders reserve space for async content
- [ ] Fonts loaded via \`next/font\` (or equivalent) with \`display: swap\`
- [ ] Heavy dependencies are code-split with dynamic imports
- [ ] Non-urgent state updates use \`startTransition\`
- [ ] Long lists are virtualized when item count exceeds ~100
- [ ] Bundle size is audited after every new dependency
- [ ] Third-party scripts are loaded asynchronously
- [ ] Core Web Vitals meet "Good" thresholds: LCP < 2.5s, CLS < 0.1, INP < 200ms`,
    agentDocs: {
      codex: `# Codex — Web Performance

## Environment
Sandboxed, file I/O only. No browser or Lighthouse access — generate optimized code patterns and verify via build output.

## When this skill is active
- Always identify the LCP element before suggesting optimizations.
- Use \`fetchpriority="high"\` or Next.js \`priority\` prop on the LCP image.
- Set explicit \`width\` and \`height\` on all images and video elements.
- Move heavy computation off the main thread with Web Workers.
- Audit bundle size after every dependency addition.

## Tool usage
- Generate optimized image components using \`next/image\` with \`priority\` and \`sizes\`.
- Generate font loading config using \`next/font/google\` or \`next/font/local\`.
- Generate skeleton placeholder components for async content areas.
- Use \`dynamic()\` imports for heavy components.

## Testing expectations
- Build must succeed with no increase in bundle size warnings.
- Check that \`priority\` or \`fetchpriority\` is present on the LCP image.
- Verify all \`<img>\` tags have \`width\` and \`height\` attributes.
- Verify no large synchronous imports in client components (use dynamic import).

## Common failure modes
- Preloading the wrong image (not the actual LCP element).
- Setting \`priority\` on multiple images (only the LCP element should have it).
- Using \`useEffect\` for state updates that should use \`startTransition\`.
- Forgetting \`display: swap\` on custom font faces.
- Adding \`will-change\` to many elements instead of just the animated ones.

## Output format
- Optimized component files with proper image, font, and code-split patterns.
- Skeleton placeholder components in \`components/ui/\`.
- Web Worker files in \`workers/\` directory.`,
      cursor: `# Cursor — Web Performance

## IDE context
Cursor has built-in terminal access for running Lighthouse CLI, bundle analysis, and build commands.

## Rules for code generation
- Preload critical resources in \`<head>\` or via \`next/head\`.
- Use Next.js \`Image\` component with \`priority\` prop for the LCP image.
- Code-split with \`dynamic()\` or \`React.lazy()\` for heavy components.
- Use \`startTransition\` for non-urgent renders that do not need immediate visual feedback.
- Profile with Chrome DevTools Performance tab before guessing at bottlenecks.

## Code style
- Image components use \`next/image\` with explicit \`width\`, \`height\`, and \`sizes\`.
- Font config at the layout level using \`next/font\`.
- Dynamic imports with \`loading\` fallback components.
- Skeleton components return deterministic heights to prevent CLS.

## Cursor features to leverage
- Terminal integration to run \`npx lighthouse\` and view reports.
- Bundle analysis via \`ANALYZE=true next build\` in the terminal.
- Code actions to convert static imports to dynamic imports.
- Error lens to flag missing \`alt\` attributes on images.

## Review checklist
- [ ] LCP image has \`priority\` prop (Next.js) or \`fetchpriority="high"\`
- [ ] All images have explicit dimensions
- [ ] Heavy components are dynamically imported
- [ ] Fonts use \`next/font\` with \`display: swap\`
- [ ] Non-urgent state updates use \`startTransition\`
- [ ] No unnecessary \`will-change\` properties`,
      claude: `# Claude — Web Performance

## Interaction patterns
When a user asks about performance optimization:
1. Ask for the current Lighthouse scores or specific metrics that are failing.
2. Identify the most impactful bottleneck (usually LCP or INP).
3. Provide targeted fixes for the identified bottleneck.
4. Suggest a measurement plan to verify the fix worked.

## Response structure
1. **Assessment** — Which Core Web Vital is failing? What is the likely cause?
2. **Plan** — Prioritize fixes by impact: LCP fix → CLS fix → INP fix → bundle reduction
3. **Implementation** — Concrete code changes with before/after patterns
4. **Verification** — How to measure the improvement (Lighthouse, DevTools, web-vitals library)

## Chain-of-thought guidance
- Start with the highest-impact fix. LCP improvements usually yield the most visible Lighthouse score change.
- Consider the waterfall: is the issue in the critical rendering path (blocking CSS/JS), resource loading (images/fonts), or runtime performance (long tasks)?
- Think about the user's framework. Next.js has built-in optimizations (Image, Font, dynamic) that vanilla React does not.
- Avoid suggesting optimizations that add complexity without measurable impact.

## Output formatting
- Show before/after code comparisons for each fix.
- Include the expected metric improvement when possible.
- Use a numbered priority list for multi-fix scenarios.
- Show Lighthouse CLI commands for measurement.

## Constraints
- Never suggest performance fixes without identifying the specific bottleneck first.
- Never recommend premature optimization — profile first, then fix.
- Always include a verification step (how to measure the improvement).
- Do not suggest \`will-change\` on more than 2-3 elements per page.`,
      agents: `# AGENTS.md — Web Performance

## Purpose
Ensure all frontend code meets Core Web Vitals "Good" thresholds and follows performance best practices.

## Review checklist
1. Is the LCP element identified, preloaded, and prioritized?
2. Do all images and videos have explicit \`width\` and \`height\` attributes?
3. Are skeleton placeholders used for async content to prevent CLS?
4. Are fonts loaded with \`next/font\` (or equivalent) with \`display: swap\`?
5. Are heavy dependencies code-split with dynamic imports?
6. Do non-urgent state updates use \`startTransition\` or \`useDeferredValue\`?
7. Are long lists (100+ items) virtualized?
8. Is bundle size audited after new dependency additions?
9. Are third-party scripts loaded asynchronously?

## Quality gates
- **LCP**: < 2.5s on 3G simulated throttling.
- **CLS**: < 0.1 measured across page load and interaction.
- **INP**: < 200ms for the slowest interaction.
- **Bundle**: no single chunk > 200KB gzipped without justification.

## Related skills
- Next.js Patterns — for framework-specific optimizations
- Tailwind Design System — for CSS optimization and font loading
- React Component Architecture — for component-level code splitting
- Accessible UI — for ensuring performance fixes don't harm accessibility

## Escalation criteria
- If Lighthouse score remains below 70 after applying standard fixes, investigate third-party script impact.
- If INP remains above 200ms, investigate heavy React re-renders with React DevTools Profiler.
- If bundle exceeds 500KB gzipped, audit dependency tree for unnecessary packages.`
    }
  },

  // -----------------------------------------------------------------------
  // 7. Accessible UI
  // -----------------------------------------------------------------------
  {
    slug: "accessible-ui",
    title: "WCAG Accessible UI",
    description:
      "W3C WCAG 2.2 compliance, ARIA patterns, keyboard navigation, screen reader testing with VoiceOver and NVDA, focus management, and inclusive design.",
    category: "frontend",
    accent: "signal-red",
    tags: ["accessibility", "a11y", "wcag", "aria", "keyboard"],
    body: `# WCAG Accessible UI

Build interfaces that work for everyone. Accessibility is not an afterthought or a checkbox — it is a fundamental quality signal that affects usability for all users, including those navigating with keyboards, screen readers, switch devices, or voice control. This skill covers W3C WCAG 2.2 compliance at levels A and AA, ARIA patterns, focus management, and testing methodology.

## When to use

- Building any user-facing UI component (forms, modals, navigation, data tables)
- Auditing an existing application for WCAG 2.2 compliance
- Implementing focus management for modals, dialogs, or multi-step flows
- Adding keyboard navigation to custom interactive widgets
- Testing with screen readers (VoiceOver, NVDA, JAWS) or automated tools (axe)
- Reviewing PRs for accessibility regressions

## When NOT to use

- Backend-only API work with no UI output
- Performance-only optimization — use Web Performance
- Visual design/art direction — use Frontend Frontier (though accessibility informs design)
- Native mobile app accessibility — this skill covers web only

## Core concepts

### WCAG 2.2 principles (POUR)

| Principle | Requirement | Key checks |
|-----------|------------|------------|
| **Perceivable** | Content presentable in multiple ways | Alt text, captions, contrast, resize |
| **Operable** | UI navigable via keyboard and alternatives | Tab order, focus visible, no traps |
| **Understandable** | Content and behavior predictable | Labels, error messages, language |
| **Robust** | Works across assistive technologies | Valid HTML, ARIA, semantic markup |

### Semantic HTML first

Prefer native HTML elements over ARIA roles:

| Instead of | Use |
|-----------|-----|
| \`<div role="button">\` | \`<button>\` |
| \`<div role="link">\` | \`<a href="...">\` |
| \`<div role="heading">\` | \`<h1>\`–\`<h6>\` |
| \`<div role="navigation">\` | \`<nav>\` |
| \`<div role="list">\` | \`<ul>\` or \`<ol>\` |

### Color contrast requirements

| Context | Minimum ratio | WCAG level |
|---------|--------------|------------|
| Normal text (< 18pt) | 4.5:1 | AA |
| Large text (≥ 18pt or bold ≥ 14pt) | 3:1 | AA |
| UI components and graphical objects | 3:1 | AA |
| Enhanced contrast | 7:1 | AAA |

## Workflow

### 1. Implement skip-to-content link

The first focusable element on the page:

\`\`\`tsx
function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="fixed left-2 top-2 z-tooltip -translate-y-full rounded-sm bg-accent px-space-md py-space-sm text-surface transition-transform focus:translate-y-0"
    >
      Skip to main content
    </a>
  );
}
\`\`\`

### 2. Implement focus trap for modals

\`\`\`tsx
import { useEffect, useRef } from "react";

function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return containerRef;
}
\`\`\`

### 3. Add ARIA live regions for dynamic content

\`\`\`tsx
function StatusMessage({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
\`\`\`

### 4. Label all form inputs

\`\`\`tsx
<div>
  <label htmlFor="email" className="text-sm font-medium text-text-primary">
    Email address
  </label>
  <input
    id="email"
    type="email"
    aria-describedby="email-error"
    aria-invalid={!!error}
    className="mt-space-xs w-full rounded-sm border border-border px-space-sm py-space-xs"
  />
  {error && (
    <p id="email-error" role="alert" className="mt-space-xs text-sm text-red-600">
      {error}
    </p>
  )}
</div>
\`\`\`

### 5. Check color contrast

Use Chrome DevTools: inspect element → color picker → contrast ratio indicator. Or use the Lighthouse accessibility audit. For programmatic checking:

\`\`\`bash
npx axe --url http://localhost:3000
\`\`\`

### 6. Keyboard navigation testing

Test every page with keyboard only:
- Tab through all interactive elements — verify logical order
- Press Enter/Space on buttons and links — verify activation
- Press Escape on modals and dropdowns — verify close behavior
- Use arrow keys in composite widgets (tabs, menus, radio groups)
- Verify visible focus indicators on every focusable element

## Examples

### Example 1 — Accessible modal dialog

\`\`\`tsx
function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  const trapRef = useFocusTrap(isOpen);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50"
         role="presentation" onClick={onClose}>
      <div ref={trapRef} role="dialog" aria-modal="true" aria-labelledby="dialog-title"
           className="w-full max-w-lg rounded-card bg-surface p-space-xl shadow-overlay"
           onClick={(e) => e.stopPropagation()}>
        <h2 id="dialog-title" className="text-xl font-semibold">{title}</h2>
        <div className="mt-space-md">{children}</div>
        <button onClick={onClose} className="mt-space-lg" aria-label="Close dialog">
          Close
        </button>
      </div>
    </div>
  );
}
\`\`\`

### Example 2 — Accessible tabs

\`\`\`tsx
function Tabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "ArrowRight") setActive((index + 1) % tabs.length);
    if (e.key === "ArrowLeft") setActive((index - 1 + tabs.length) % tabs.length);
  }

  return (
    <div>
      <div role="tablist" className="flex gap-space-sm border-b border-border">
        {tabs.map((tab, i) => (
          <button key={i} role="tab" id={\`tab-\${i}\`} aria-selected={active === i}
                  aria-controls={\`panel-\${i}\`} tabIndex={active === i ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, i)} onClick={() => setActive(i)}
                  className={active === i ? "border-b-2 border-accent" : ""}>
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div key={i} role="tabpanel" id={\`panel-\${i}\`} aria-labelledby={\`tab-\${i}\`}
             hidden={active !== i} className="p-space-md">
          {tab.content}
        </div>
      ))}
    </div>
  );
}
\`\`\`

## Decision tree

- **Building a modal or dialog?** → Focus trap + \`aria-modal\` + return focus on close
- **Dynamic content updates?** → \`aria-live="polite"\` region
- **Custom interactive widget?** → Follow WAI-ARIA Authoring Practices patterns
- **Form with validation?** → \`aria-invalid\` + \`aria-describedby\` linking error messages
- **Icon-only button?** → \`aria-label\` on the button element
- **Data table?** → Use \`<table>\`, \`<th scope>\`, and \`<caption>\`
- **Need to check contrast?** → DevTools color picker, Lighthouse audit, or axe

## Edge cases and gotchas

1. **aria-live and React re-renders** — React may batch state updates which causes live regions to not announce. Use a small delay or separate the live region from the state that changes.
2. **Focus indicator suppression** — Never use \`outline: none\` without providing a visible alternative. Tailwind's \`focus-visible:ring\` pattern is recommended.
3. **Tooltips and touch devices** — Tooltips triggered on hover are inaccessible on touch. Ensure tooltip content is also available via focus or in the visible UI.
4. **Auto-playing media** — Audio or video that auto-plays must have a visible pause/stop mechanism. Prefer not auto-playing.
5. **Color-only indicators** — Error states shown only with red color fail for colorblind users. Add an icon, text label, or pattern as a secondary indicator.
6. **Heading hierarchy** — Skipping heading levels (\`<h1>\` → \`<h3>\`) confuses screen reader navigation. Maintain sequential hierarchy.

## Evaluation criteria

- [ ] All interactive elements are keyboard-accessible with Tab, Enter, Space, Escape, Arrow keys
- [ ] Focus indicators are visible on every focusable element
- [ ] Skip-to-content link is the first focusable element
- [ ] Focus is trapped in modals and returned to trigger on close
- [ ] All form inputs have associated labels (via \`<label>\` or \`aria-label\`)
- [ ] Error messages are linked with \`aria-describedby\` and announced with \`role="alert"\`
- [ ] ARIA live regions announce dynamic content changes
- [ ] Color contrast meets WCAG AA minimums (4.5:1 for text, 3:1 for large text and UI)
- [ ] Information is not conveyed by color alone
- [ ] Heading hierarchy is sequential (no skipped levels)
- [ ] axe or Lighthouse accessibility audit shows zero violations`,
    agentDocs: {
      codex: `# Codex — Accessible UI

## Environment
Sandboxed, file I/O only. No screen reader or browser preview — ensure code follows ARIA patterns structurally.

## When this skill is active
- Use semantic HTML elements before reaching for ARIA roles.
- Every interactive element must be keyboard-accessible.
- Trap focus in modals and dialogs; restore focus to the trigger on close.
- Maintain 4.5:1 contrast ratio for normal text, 3:1 for large text and UI components.
- Test patterns against WAI-ARIA Authoring Practices documentation.

## Tool usage
- Generate skip-to-content links in layout components.
- Generate focus trap hooks in \`hooks/useFocusTrap.ts\`.
- Generate ARIA live region components in \`components/ui/\`.
- Add \`aria-\` attributes to form components inline.

## Testing expectations
- Every \`<button>\`, \`<a>\`, \`<input>\`, and custom widget should be keyboard-reachable.
- Modal components must call \`useFocusTrap\` and return focus on close.
- Form error messages must be linked to inputs via \`aria-describedby\`.
- Build must succeed — verify no broken ARIA attribute references.

## Common failure modes
- Using \`<div onClick>\` instead of \`<button>\` — not keyboard accessible.
- Missing \`aria-label\` on icon-only buttons.
- \`outline: none\` without a replacement focus indicator.
- Modal does not trap focus or return focus to trigger.
- Heading hierarchy skips levels (\`<h1>\` → \`<h3>\`).
- Live region not announcing because React batches the update.

## Output format
- Component files with proper ARIA attributes inline.
- Reusable hooks (\`useFocusTrap\`, \`useAnnounce\`) in \`hooks/\`.
- Skip-to-content component in \`components/ui/SkipToContent.tsx\`.`,
      cursor: `# Cursor — Accessible UI

## IDE context
Cursor supports linting with eslint-plugin-jsx-a11y for inline accessibility warnings.

## Rules for code generation
- Add \`aria-label\` to every icon-only button.
- Use \`aria-live="polite"\` for status messages and \`aria-live="assertive"\` for errors.
- Never suppress focus outlines without providing a visible alternative (\`focus-visible:ring\`).
- Use Radix UI, Headless UI, or React Aria primitives that handle a11y patterns by default.
- Skip-to-content link should be the first focusable element in the layout.

## Code style
- Focus indicators: \`focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2\`.
- Labels: \`<label htmlFor={id}>\` paired with input \`id\`.
- Errors: \`aria-invalid={!!error}\` on input, \`aria-describedby={errorId}\` linking to error message.
- Modals: \`role="dialog"\` with \`aria-modal="true"\` and \`aria-labelledby\`.

## Cursor features to leverage
- eslint-plugin-jsx-a11y integration for inline warnings.
- Cmd+K to generate accessible form fields with proper label linkage.
- Multi-file editing to add skip-to-content across layouts simultaneously.

## Review checklist
- [ ] All interactive elements are keyboard-accessible
- [ ] Focus indicators are visible (\`focus-visible:ring\` pattern)
- [ ] Icon-only buttons have \`aria-label\`
- [ ] Form inputs have associated \`<label>\` or \`aria-label\`
- [ ] Modals trap focus and restore on close
- [ ] Heading hierarchy is sequential`,
      claude: `# Claude — Accessible UI

## Interaction patterns
When a user asks about accessibility:
1. Determine the component type (form, modal, navigation, data table, custom widget).
2. Reference the appropriate WAI-ARIA Authoring Practices pattern.
3. Provide a complete implementation with all ARIA attributes.
4. Include a testing checklist for the specific component.

## Response structure
1. **Assessment** — What WCAG criteria apply? What component pattern is needed?
2. **Plan** — Semantic HTML → ARIA augmentation → keyboard behavior → focus management → testing
3. **Implementation** — Complete component with ARIA, focus trap, keyboard handlers
4. **Verification** — Manual keyboard test steps + automated audit commands

## Chain-of-thought guidance
- Start with the most semantic HTML possible. Only add ARIA when native elements are insufficient.
- Think about the keyboard user: how do they discover, navigate, and operate this widget?
- Think about the screen reader user: what is announced when they encounter this element?
- Consider the error state: is the error announced and linked to the input?

## Output formatting
- Complete component code with all ARIA attributes inline.
- Testing steps as a numbered checklist (keyboard, screen reader, contrast).
- Reference to the specific WAI-ARIA Authoring Practices pattern when applicable.
- Contrast ratio requirements stated for the specific context.

## Constraints
- Never suggest \`outline: none\` without an alternative focus indicator.
- Never use \`<div onClick>\` for interactive elements — always use \`<button>\` or \`<a>\`.
- Always include keyboard interaction documentation for custom widgets.
- Never suggest aria-hidden="true" on interactive or meaningful content.`,
      agents: `# AGENTS.md — Accessible UI

## Purpose
Ensure all UI components meet WCAG 2.2 AA compliance with proper semantics, keyboard access, and screen reader support.

## Review checklist
1. Are all interactive elements keyboard-accessible (Tab, Enter, Space, Escape, Arrow)?
2. Are visible focus indicators present on every focusable element?
3. Is focus trapped in modals/dialogs and returned to the trigger on close?
4. Do all form inputs have associated labels (\`<label>\` or \`aria-label\`)?
5. Are error messages linked to inputs via \`aria-describedby\` and announced with \`role="alert"\`?
6. Do color contrast ratios meet WCAG AA minimums?
7. Is information never conveyed by color alone?
8. Is heading hierarchy sequential (no skipped levels)?
9. Are ARIA live regions used for dynamic content updates?
10. Is there a skip-to-content link as the first focusable element?

## Quality gates
- **Automated audit**: axe-core or Lighthouse accessibility audit shows zero violations.
- **Keyboard test**: complete page flow using only keyboard input.
- **Screen reader test**: VoiceOver or NVDA announces all interactive elements correctly.
- **Zoom test**: content remains usable at 200% zoom without horizontal scroll.

## Related skills
- React Component Architecture — for component structure that supports a11y
- Frontend Frontier — for ensuring art direction does not compromise accessibility
- CSS Responsive Layouts — for ensuring responsive design supports zoom and reflow
- Web Performance — for ensuring a11y features do not degrade performance

## Escalation criteria
- If a custom widget requires complex ARIA patterns, reference WAI-ARIA Authoring Practices directly.
- If color contrast cannot meet AA with the current palette, escalate to design/art direction.
- If third-party components lack accessibility, evaluate replacing them with Radix UI or Headless UI.`
    }
  },

  // -----------------------------------------------------------------------
  // 8. Next.js Patterns
  // -----------------------------------------------------------------------
  {
    slug: "nextjs-patterns",
    title: "Next.js Patterns",
    description:
      "App Router architecture, React Server Components, data fetching patterns, caching, middleware, and production deployment with Next.js.",
    category: "frontend",
    accent: "signal-red",
    tags: ["nextjs", "react", "app-router", "rsc", "ssr"],
    body: `# Next.js Patterns

Production patterns for Next.js App Router: React Server Components, data fetching, caching strategies, Server Actions, streaming with Suspense, middleware, metadata, and error handling. This skill covers the architecture decisions that determine whether a Next.js app is fast, maintainable, and secure in production.

## When to use

- Building a new application on Next.js App Router
- Migrating from Pages Router to App Router
- Deciding server vs. client component boundaries
- Implementing data fetching with caching and revalidation
- Setting up authentication middleware
- Configuring metadata and SEO for production
- Implementing Server Actions for form mutations

## When NOT to use

- Non-Next.js React applications — use React patterns directly
- Static sites with no server requirements — consider Astro or Vite
- Backend API design — Next.js API routes are thin; use dedicated backend services for complex logic
- CSS/design system work — use Tailwind Design System skill
- Animation and motion — use Framer Motion or GSAP skills

## Core concepts

### Server vs. Client Components

| Concern | Server Component | Client Component |
|---------|-----------------|------------------|
| Data fetching | Direct DB/API access | Via API route or Server Action |
| Bundle size | Zero JS shipped | Included in client bundle |
| Interactivity | None (no hooks, no effects) | Full React interactivity |
| Browser APIs | Not available | Full access (window, document) |
| Default | Yes (no directive needed) | Requires \`"use client"\` |

**Rule:** Default to Server Components. Add \`"use client"\` only when you need interactivity, effects, or browser APIs. Push the \`"use client"\` boundary as deep into the component tree as possible.

### Caching layers

| Layer | Scope | Control | Default |
|-------|-------|---------|---------|
| Request memoization | Single render | Automatic for \`fetch()\` | On |
| Data cache | Across requests | \`revalidate\`, \`no-store\` | On |
| Full route cache | Entire route | Static/dynamic rendering | Static if possible |
| Router cache | Client-side | \`router.refresh()\`, \`revalidatePath()\` | On |

## Workflow

### 1. Define the route structure

\`\`\`
app/
  layout.tsx          # root layout (Server Component)
  page.tsx            # home page
  loading.tsx         # loading UI for streaming
  error.tsx           # error boundary
  not-found.tsx       # 404 page
  (marketing)/
    page.tsx          # marketing home with different layout
    layout.tsx        # marketing layout
  dashboard/
    layout.tsx        # dashboard layout with sidebar
    page.tsx          # dashboard home
    settings/
      page.tsx        # settings page
\`\`\`

### 2. Server Actions for mutations

\`\`\`tsx
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;

  await db.post.create({ data: { title, body } });
  revalidatePath("/posts");
  redirect("/posts");
}
\`\`\`

### 3. Streaming with Suspense

\`\`\`tsx
import { Suspense } from "react";

async function SlowData() {
  const data = await fetchExpensiveData();
  return <DataDisplay data={data} />;
}

export default function Page() {
  return (
    <main>
      <h1>Dashboard</h1>
      <Suspense fallback={<TableSkeleton />}>
        <SlowData />
      </Suspense>
    </main>
  );
}
\`\`\`

### 4. Middleware for auth and routing

\`\`\`tsx
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
\`\`\`

### 5. Metadata API for SEO

\`\`\`tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }],
    },
  };
}
\`\`\`

### 6. Parallel data fetching

\`\`\`tsx
export default async function DashboardPage() {
  const [stats, recentPosts, notifications] = await Promise.all([
    getStats(),
    getRecentPosts(),
    getNotifications(),
  ]);

  return (
    <div>
      <StatsPanel stats={stats} />
      <PostList posts={recentPosts} />
      <NotificationFeed notifications={notifications} />
    </div>
  );
}
\`\`\`

### 7. Error boundary hierarchy

\`\`\`tsx
"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-space-md p-space-xl">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-text-secondary">{error.message}</p>
      <button onClick={reset} className="rounded-sm bg-accent px-space-md py-space-sm text-surface">
        Try again
      </button>
    </div>
  );
}
\`\`\`

## Examples

### Example 1 — ISR with revalidation

\`\`\`tsx
async function getProducts() {
  const res = await fetch("https://api.example.com/products", {
    next: { revalidate: 3600 },
  });
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductGrid products={products} />;
}
\`\`\`

### Example 2 — Form with Server Action

\`\`\`tsx
import { createPost } from "./actions";

export default function NewPostForm() {
  return (
    <form action={createPost}>
      <input name="title" required placeholder="Post title" />
      <textarea name="body" required placeholder="Write something..." />
      <button type="submit">Publish</button>
    </form>
  );
}
\`\`\`

### Example 3 — Route group with separate layout

\`\`\`
app/
  (auth)/
    login/page.tsx
    register/page.tsx
    layout.tsx          # centered card layout for auth pages
  (app)/
    dashboard/page.tsx
    settings/page.tsx
    layout.tsx          # sidebar layout for app pages
\`\`\`

## Decision tree

- **Need interactivity (state, effects, browser APIs)?** → \`"use client"\`
- **Fetching data for display?** → Server Component with direct fetch
- **Form submission / mutation?** → Server Action with \`"use server"\`
- **Slow data on a page?** → Wrap in \`<Suspense>\` for streaming
- **Auth protection?** → Middleware with path matcher
- **SEO metadata?** → \`generateMetadata\` function in the page file
- **Shared layout with state?** → Route group with client layout
- **Cache invalidation after mutation?** → \`revalidatePath()\` or \`revalidateTag()\`

## Edge cases and gotchas

1. **"use client" boundary** — \`"use client"\` goes at the top of the file, before imports. It marks that file and all its imports as client components. Push this boundary as deep as possible.
2. **Server Action security** — Server Actions are POST endpoints. Always validate input server-side. Never trust formData without sanitization.
3. **Middleware limitations** — Middleware runs at the edge. It cannot access Node.js APIs (fs, crypto, etc.) or make database connections directly.
4. **Hydration mismatch** — Server and client must render the same initial HTML. Avoid \`Date.now()\`, \`Math.random()\`, or browser-only checks in shared render paths.
5. **Caching surprises** — \`fetch()\` in Server Components is cached by default. Use \`{ cache: "no-store" }\` for data that must always be fresh.
6. **Route groups don't affect URL** — \`(marketing)/about/page.tsx\` maps to \`/about\`, not \`/marketing/about\`.

## Evaluation criteria

- [ ] Server Components are the default; \`"use client"\` is pushed as deep as possible
- [ ] Data fetches are parallelized with \`Promise.all\` (no waterfalls)
- [ ] Mutations use Server Actions with server-side validation
- [ ] Slow data is wrapped in \`<Suspense>\` with appropriate fallbacks
- [ ] Middleware handles auth/routing for protected paths
- [ ] \`generateMetadata\` provides title, description, and OpenGraph for every page
- [ ] Error boundaries (\`error.tsx\`) exist at layout and page levels
- [ ] Loading states (\`loading.tsx\`) provide meaningful skeleton UI
- [ ] Environment secrets are in \`.env.local\`, never committed
- [ ] Caching strategy is intentional (\`revalidate\`, \`no-store\`, or tags)`,
    agentDocs: {
      codex: `# Codex — Next.js Patterns

## Environment
Sandboxed, file I/O. No dev server preview — generate structurally correct Next.js code.

## When this skill is active
- Default to Server Components. Add \`"use client"\` only when needed for interactivity.
- Parallelize data fetches with \`Promise.all\` — never waterfall sequential fetches.
- Use Server Actions for mutations with server-side input validation.
- Keep middleware lightweight — edge runtime has limited APIs.
- Set metadata via \`generateMetadata\` for SEO on every page.

## Tool usage
- Route structure: \`app/\` directory with \`page.tsx\`, \`layout.tsx\`, \`loading.tsx\`, \`error.tsx\`.
- Server Actions: \`"use server"\` functions in \`app/actions/\` or co-located.
- Middleware: single \`middleware.ts\` at the project root.
- Metadata: \`generateMetadata\` in page files, not hardcoded.

## Testing expectations
- Build must succeed: \`pnpm build\` should complete without errors.
- Server Components should not import client-only libraries (no \`useState\`, no \`useEffect\`).
- Server Actions should validate all input before database operations.
- Middleware should not make database calls or use Node.js-only APIs.

## Common failure modes
- Importing \`useState\` in a Server Component — missing \`"use client"\` directive.
- Sequential data fetches creating a waterfall (\`await A; await B\` instead of \`Promise.all\`).
- Server Action without input validation — security vulnerability.
- Middleware trying to access Node.js APIs (edge runtime limitation).
- Cached fetch returning stale data — missing \`revalidate\` or \`no-store\`.

## Output format
- Route files: \`page.tsx\`, \`layout.tsx\`, \`loading.tsx\`, \`error.tsx\` per route.
- Server Actions: exported async functions with \`"use server"\`.
- Middleware: single \`middleware.ts\` with \`config.matcher\`.`,
      cursor: `# Cursor — Next.js Patterns

## IDE context
Cursor provides TypeScript support for Next.js types: \`Metadata\`, \`NextRequest\`, \`NextResponse\`, page/layout prop types.

## Rules for code generation
- \`"use client"\` goes at the top of the file, before imports.
- Server Actions use \`"use server"\` directive at the function or file level.
- Use \`revalidatePath\` or \`revalidateTag\` for cache invalidation after mutations.
- \`loading.tsx\` provides automatic streaming Suspense fallback.
- \`error.tsx\` must be a Client Component (it uses \`reset()\` which is interactive).

## Code style
- Page components: default export, async when fetching data.
- Layout components: accept \`{ children }\` prop, default export.
- Server Actions: named exports, explicit return types, input validation first.
- Middleware: single function export, \`config.matcher\` for path filtering.

## Cursor features to leverage
- TypeScript autocompletion for Next.js page props and metadata types.
- File creation commands to scaffold route directories with all required files.
- Terminal integration to run \`pnpm build\` and verify no build errors.
- Error lens for missing \`"use client"\` directives.

## Review checklist
- [ ] Server/client boundaries are correct (no hooks in Server Components)
- [ ] Data fetches are parallelized with \`Promise.all\`
- [ ] Server Actions validate input before mutations
- [ ] \`loading.tsx\` provides skeleton UI for slow routes
- [ ] \`error.tsx\` is present at appropriate levels
- [ ] Secrets are in \`.env.local\`, not committed`,
      claude: `# Claude — Next.js Patterns

## Interaction patterns
When a user asks about Next.js architecture:
1. Determine the Next.js version and whether they use App Router or Pages Router.
2. Identify the specific pattern needed: data fetching, caching, auth, mutations, or deployment.
3. Provide a complete implementation with file structure context.
4. Include production considerations (error handling, metadata, security).

## Response structure
1. **Assessment** — What Next.js version? App Router? What specific pattern?
2. **Plan** — Route structure → component boundaries → data flow → caching → error handling
3. **Implementation** — Complete file(s) with proper directives, types, and error handling
4. **Verification** — Build test, security check, caching behavior verified

## Chain-of-thought guidance
- Think about the server/client boundary: what needs interactivity vs. what can be static?
- Consider the data flow: where does data originate, how is it cached, when is it invalidated?
- Think about the error case: what happens when the database is down or the API fails?
- Consider SEO: is this page discoverable? Does it have proper metadata?

## Output formatting
- Show file paths for every code block (\`app/dashboard/page.tsx\`).
- Include the \`"use client"\` or \`"use server"\` directive in every relevant file.
- Show the route structure as a file tree for architectural decisions.
- Include the caching strategy in comments or explanation.

## Constraints
- Never use \`"use client"\` on a Server Component that only displays data.
- Never suggest Pages Router patterns for App Router questions (or vice versa).
- Always validate Server Action input server-side.
- Never suggest database connections in middleware (edge runtime limitation).`,
      agents: `# AGENTS.md — Next.js Patterns

## Purpose
Ensure Next.js applications follow App Router best practices for performance, security, and maintainability.

## Review checklist
1. Are Server Components the default (no unnecessary \`"use client"\` directives)?
2. Is \`"use client"\` pushed as deep into the component tree as possible?
3. Are data fetches parallelized with \`Promise.all\` (no waterfalls)?
4. Do Server Actions validate all input server-side?
5. Is \`<Suspense>\` used for streaming slow data with skeleton fallbacks?
6. Does middleware handle auth and routing without heavy computation?
7. Does every page have \`generateMetadata\` for SEO?
8. Are error boundaries (\`error.tsx\`) present at appropriate route levels?
9. Are environment secrets in \`.env.local\` and not committed?
10. Is the caching strategy intentional and documented?

## Quality gates
- **Build**: \`pnpm build\` must succeed without errors or warnings.
- **Security**: Server Actions must validate input; no raw user data in queries.
- **SEO**: every page must have title, description, and OpenGraph metadata.
- **Performance**: no data fetch waterfalls; streaming for slow data.

## Related skills
- React Component Architecture — for component patterns within Next.js
- Web Performance — for Core Web Vitals optimization
- Tailwind Design System — for styling within Next.js
- Accessible UI — for ensuring Next.js pages are accessible

## Escalation criteria
- If the project needs complex API logic beyond simple CRUD, consider a dedicated backend service.
- If middleware needs database access, consider moving the check to a Server Component or Server Action.
- If caching behavior is confusing, add logging to identify which cache layer is active.`
    }
  },

  // -----------------------------------------------------------------------
  // 9. CSS Responsive Layouts
  // -----------------------------------------------------------------------
  {
    slug: "responsive-layouts",
    title: "CSS Responsive Layouts",
    description:
      "Responsive design with CSS container queries, fluid typography, modern CSS grid and flexbox patterns, and mobile-first development.",
    category: "frontend",
    accent: "signal-red",
    tags: ["responsive", "css", "grid", "flexbox", "container-queries"],
    body: `# CSS Responsive Layouts

Modern responsive design goes beyond media queries. Container queries let components adapt to their container rather than the viewport. Fluid typography with \`clamp()\` scales smoothly without breakpoints. CSS Grid and Flexbox handle complex layouts intrinsically. This skill covers the patterns that make interfaces adapt gracefully from 320px phones to ultrawide monitors.

## When to use

- Building any layout that must work across mobile, tablet, and desktop
- Implementing container-responsive components that adapt to their parent's size
- Setting up fluid typography and spacing that scales without breakpoint jumps
- Creating grid-based layouts with dynamic column counts
- Building responsive navigation, sidebars, or dashboards
- Using modern CSS features: container queries, \`aspect-ratio\`, \`dvh\`, subgrid

## When NOT to use

- Animation and motion concerns — use Framer Motion or GSAP skills
- Design token architecture — use Tailwind Design System skill
- JavaScript-based layout logic (virtualization, infinite scroll) — those are component architecture concerns
- Print stylesheets — different optimization goals

## Core concepts

### Container queries vs. media queries

| Feature | Media query | Container query |
|---------|------------|-----------------|
| Responds to | Viewport size | Container size |
| Use for | Page-level layout | Component-level adaptation |
| Syntax | \`@media (min-width: 768px)\` | \`@container (min-width: 400px)\` |
| Reusability | Component behaves differently based on where it is placed | Component adapts to its own context |

Container queries require a containment context:

\`\`\`css
.card-grid { container-type: inline-size; }

@container (min-width: 600px) {
  .card { grid-template-columns: auto 1fr; }
}
\`\`\`

### Fluid sizing with clamp()

\`\`\`css
/* Fluid font: min 1rem, preferred 0.5rem + 2vw, max 2rem */
font-size: clamp(1rem, 0.5rem + 2vw, 2rem);

/* Fluid spacing: min 1rem, preferred 2vw + 0.5rem, max 3rem */
padding: clamp(1rem, 2vw + 0.5rem, 3rem);

/* Fluid gap */
gap: clamp(0.75rem, 1.5vw, 2rem);
\`\`\`

### Grid patterns

**Responsive auto-fill grid:**
\`\`\`css
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 1.5rem;
}
\`\`\`

**Named grid areas:**
\`\`\`css
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "nav    main"
    "footer footer";
  grid-template-columns: fit-content(280px) 1fr;
  grid-template-rows: auto 1fr auto;
}

@media (max-width: 768px) {
  .layout {
    grid-template-areas:
      "header"
      "main"
      "footer";
    grid-template-columns: 1fr;
  }
}
\`\`\`

**Subgrid for alignment:**
\`\`\`css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}
\`\`\`

## Workflow

### 1. Start mobile-first

Write base styles for the smallest viewport. Enhance upward with \`min-width\` media queries or container queries.

\`\`\`css
.layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .layout {
    flex-direction: row;
  }
}
\`\`\`

### 2. Set up container query contexts

\`\`\`tsx
<div className="@container">
  <div className="flex flex-col @md:flex-row @md:items-center gap-space-sm">
    <img className="w-full @md:w-48 aspect-video object-cover rounded-sm" src={img} alt="" />
    <div>
      <h3 className="font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  </div>
</div>
\`\`\`

### 3. Use fluid type and spacing

Define the type scale with \`clamp()\` in your token system. Apply to headings, body, and spacing:

\`\`\`tsx
<h1 className="text-5xl">Fluid heading</h1>
<p className="text-base mt-space-md">Body with fluid spacing</p>
\`\`\`

### 4. Handle responsive navigation

\`\`\`tsx
function ResponsiveNav({ items }: { items: NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="relative">
      <button
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="nav-menu"
      >
        Menu
      </button>
      <ul
        id="nav-menu"
        className={cn(
          "flex flex-col gap-space-xs md:flex-row md:gap-space-md",
          isOpen ? "block" : "hidden md:flex"
        )}
      >
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
\`\`\`

### 5. Use aspect-ratio for media

\`\`\`css
.video-embed { aspect-ratio: 16 / 9; }
.square-avatar { aspect-ratio: 1; }
.card-image { aspect-ratio: 4 / 3; }
\`\`\`

### 6. Use dvh for full-height mobile layouts

\`\`\`css
.mobile-full-height {
  min-height: 100dvh;
}
\`\`\`

## Examples

### Example 1 — Dashboard with responsive sidebar

\`\`\`tsx
<div className="grid grid-cols-1 md:grid-cols-[fit-content(280px)_1fr] min-h-screen">
  <aside className="hidden md:block border-r border-border p-space-md">
    <SideNav />
  </aside>
  <main className="p-space-lg">{children}</main>
</div>
\`\`\`

### Example 2 — Responsive card grid with container queries

\`\`\`tsx
<div className="@container">
  <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-space-md">
    {cards.map((card) => (
      <Card key={card.id} {...card} />
    ))}
  </div>
</div>
\`\`\`

### Example 3 — Fluid section padding

\`\`\`tsx
<section className="px-[clamp(1rem,5vw,4rem)] py-[clamp(2rem,8vw,6rem)]">
  <h2 className="text-4xl font-display text-text-primary text-balance">
    Responsive section
  </h2>
</section>
\`\`\`

## Decision tree

- **Component needs to adapt to its container?** → Container query (\`@container\`)
- **Page-level layout breakpoint?** → Media query (\`@media\`)
- **Dynamic column count?** → \`repeat(auto-fill, minmax(...))\` grid
- **Sidebar + main content?** → \`grid-template-columns: fit-content(Npx) 1fr\`
- **Cards need aligned internal rows?** → Subgrid
- **Smooth type/spacing scaling?** → \`clamp()\` with viewport units
- **Full-height mobile section?** → \`min-height: 100dvh\`
- **Responsive image ratio?** → \`aspect-ratio\` property

## Edge cases and gotchas

1. **Container query support** — Container queries have ~93% global support. Provide a reasonable fallback layout for older browsers.
2. **dvh on desktop** — \`dvh\` is designed for mobile browsers where the address bar resizes. On desktop, \`dvh\` equals \`vh\`. Use \`dvh\` for mobile full-height, \`vh\` or \`svh\` where appropriate.
3. **Subgrid browser support** — Subgrid has ~89% support. Test in target browsers and provide a non-subgrid fallback.
4. **min() in minmax()** — Use \`minmax(min(280px, 100%), 1fr)\` to prevent grid overflow on small screens where \`280px\` exceeds the container width.
5. **Touch targets** — Minimum 44x44px for touch targets on mobile. Use padding, not just content size, to reach the minimum.
6. **Horizontal scroll** — Never allow unintentional horizontal scroll at any breakpoint. Test at 320px width and zoom to 200%.

## Evaluation criteria

- [ ] Mobile-first approach: base styles work at 320px, enhanced upward
- [ ] Container queries used for component-level responsiveness
- [ ] Typography is fluid with \`clamp()\` (no abrupt size jumps)
- [ ] Grid layouts use \`auto-fill\`/\`auto-fit\` with \`minmax()\` for dynamic columns
- [ ] Touch targets are minimum 44x44px on mobile
- [ ] No horizontal scroll at any breakpoint (320px to ultrawide)
- [ ] \`dvh\` used for mobile full-height layouts
- [ ] \`aspect-ratio\` used for consistent media proportions
- [ ] Navigation is usable on mobile (hamburger or collapsible pattern)
- [ ] Tested at 200% zoom without horizontal scroll`,
    agentDocs: {
      codex: `# Codex — CSS Responsive Layouts

## Environment
Sandboxed, file I/O only. No browser preview — ensure CSS is structurally valid and follows mobile-first methodology.

## When this skill is active
- Use container queries for component-level responsiveness.
- Use \`clamp()\` for fluid typography and spacing.
- Start mobile-first: base styles for smallest viewport, enhance upward.
- Touch targets must be minimum 44x44px on mobile.
- Test at 320px width and 200% zoom (verify no horizontal scroll).

## Tool usage
- Generate responsive layout components in \`components/layouts/\`.
- Define fluid token scales in the global CSS \`@theme\` block.
- Place responsive navigation in \`components/ui/ResponsiveNav.tsx\`.
- Use Tailwind's \`@container\` variant for container-query-based responsive classes.

## Testing expectations
- Build must succeed: all CSS syntax valid for Tailwind v4.
- Verify no fixed widths that could cause overflow on small screens.
- Check that container query contexts (\`@container\`) are set on parent elements.
- Verify touch targets are at least 44x44px (padding counts).

## Common failure modes
- Missing \`container-type: inline-size\` on the parent of container-queried children.
- Using \`minmax(280px, 1fr)\` without \`min(280px, 100%)\` — overflows small screens.
- Fixed-width elements (\`w-[500px]\`) that cause horizontal scroll on mobile.
- Not testing at 200% zoom (content becomes unreadable or overflows).
- Using \`vh\` instead of \`dvh\` for mobile full-height sections.

## Output format
- Layout components in \`components/layouts/\`.
- Responsive utilities in global CSS.
- Navigation components with mobile toggle in \`components/ui/\`.`,
      cursor: `# Cursor — CSS Responsive Layouts

## IDE context
Cursor provides Tailwind CSS IntelliSense for container query variants (\`@sm:\`, \`@md:\`, \`@lg:\`).

## Rules for code generation
- Prefer container queries (\`@container\`) over media queries for component-level styling.
- Use \`auto-fill\` with \`minmax()\` for responsive grids that adapt without breakpoints.
- \`dvh\` is more reliable than \`vh\` on mobile for full-height layouts.
- \`flex-wrap\` + \`gap\` is often simpler than media query breakpoints for simple row-to-column.
- Avoid fixed widths — use \`min()\`, \`max()\`, \`clamp()\` for flexible sizing.

## Code style
- Tailwind container query syntax: \`@container\` on parent, \`@sm:\`/\`@md:\`/\`@lg:\` on children.
- Grid declarations with explicit template areas for complex layouts.
- \`clamp()\` values defined as Tailwind theme tokens for fluid sizing.
- \`aspect-ratio\` for consistent media proportions.

## Cursor features to leverage
- Tailwind IntelliSense for container query variant suggestions.
- Responsive preview tools (though real device testing is still required).
- Multi-cursor to update breakpoint classes across similar components.

## Review checklist
- [ ] Container queries used for reusable component responsiveness
- [ ] Typography scales fluidly with \`clamp()\`
- [ ] No horizontal scroll at 320px width
- [ ] Touch targets are 44x44px minimum
- [ ] \`dvh\` used for mobile full-height
- [ ] Grid uses \`min()\` inside \`minmax()\` to prevent overflow`,
      claude: `# Claude — CSS Responsive Layouts

## Interaction patterns
When a user asks about responsive design:
1. Determine the layout pattern needed (sidebar, grid, navigation, full-page).
2. Ask about target devices and breakpoints.
3. Provide a mobile-first implementation with container queries where appropriate.
4. Include testing guidance for edge cases (320px, zoom, touch targets).

## Response structure
1. **Assessment** — What layout pattern? What devices and breakpoints?
2. **Plan** — Mobile base → container queries → media queries → fluid sizing → testing
3. **Implementation** — Complete responsive component with all breakpoints
4. **Verification** — Test at 320px, 768px, 1440px, and 200% zoom

## Chain-of-thought guidance
- Start from the smallest screen: what does this look like on a 320px phone?
- Think about the content reflow: how do elements rearrange, not just resize?
- Consider container queries: would this component be placed in differently-sized contexts?
- Think about the touch experience: are buttons large enough? Is there enough spacing?

## Output formatting
- Show mobile and desktop states separately with comments.
- Include the \`@container\` setup when using container queries.
- Show \`clamp()\` calculations with min/preferred/max explained.
- Provide a testing checklist for breakpoint verification.

## Constraints
- Never use fixed pixel widths for layout containers.
- Always include the mobile state (320px) in examples.
- Never omit touch target sizing for interactive elements on mobile.
- Always use \`min()\` inside \`minmax()\` for grid columns to prevent overflow.`,
      agents: `# AGENTS.md — CSS Responsive Layouts

## Purpose
Ensure all layouts adapt gracefully across devices with no horizontal scroll, adequate touch targets, and fluid sizing.

## Review checklist
1. Does the layout follow mobile-first methodology (base styles for small screens)?
2. Are container queries used for component-level responsiveness?
3. Is typography fluid with \`clamp()\` (no abrupt size jumps between breakpoints)?
4. Do grid layouts use \`auto-fill\`/\`auto-fit\` with \`minmax(min(...), 1fr)\`?
5. Are touch targets at least 44x44px on mobile?
6. Is there no horizontal scroll at any width from 320px to ultrawide?
7. Is \`dvh\` used for mobile full-height layouts?
8. Is \`aspect-ratio\` used for consistent media proportions?
9. Does the layout remain usable at 200% zoom?

## Quality gates
- **320px test**: layout must be fully functional and readable.
- **200% zoom test**: no horizontal scroll, all content accessible.
- **Touch target audit**: no interactive element smaller than 44x44px.
- **Container query coverage**: reusable components use container queries, not media queries.

## Related skills
- Tailwind Design System — for token-based fluid sizing
- React Component Architecture — for composable responsive components
- Accessible UI — for zoom and reflow requirements
- Web Performance — for responsive image loading

## Escalation criteria
- If the layout requires JavaScript-based responsiveness (virtualization, dynamic columns), escalate to React Component Architecture.
- If container query support is insufficient for the target audience, provide media query fallbacks.
- If the design requires radically different layouts per breakpoint, consider separate mobile/desktop components.`
    }
  },

  // -----------------------------------------------------------------------
  // 10. React Component Architecture
  // -----------------------------------------------------------------------
  {
    slug: "component-architecture",
    title: "React Component Architecture",
    description:
      "React component patterns: composition, compound components, render props, custom hooks, state management boundaries, and code organization.",
    category: "frontend",
    accent: "signal-red",
    tags: ["react", "components", "patterns", "architecture", "hooks"],
    body: `# React Component Architecture

Patterns for building maintainable, reusable React component systems. Good architecture means components are composable, state boundaries are clear, logic is extracted into hooks, and the file structure communicates intent. This skill covers the patterns that scale from a handful of components to hundreds.

## When to use

- Designing a new component library or feature module
- Refactoring tangled components with too many props or mixed concerns
- Deciding between context, props, URL state, or a state management library
- Building compound components (tabs, accordions, selects) with shared state
- Establishing file organization conventions for a growing codebase
- Defining server/client component boundaries in Next.js App Router

## When NOT to use

- CSS layout and responsive design — use Responsive Layouts skill
- Animation and motion — use Framer Motion or GSAP skills
- Data fetching and caching specifics — use Next.js Patterns skill
- Performance profiling — use Web Performance skill

## Core concepts

### Composition over configuration

Prefer small, composable components over monolithic components with many props:

\`\`\`tsx
// Composable — clear structure, extensible
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Badge>New</Card.Badge>
  </Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>

// Avoid — prop-heavy, inflexible
<Card
  title="Title"
  badge="New"
  body="Content"
  footerAction="Action"
  headerVariant="large"
  showBadge
/>
\`\`\`

### Component categories

| Type | Purpose | State | Examples |
|------|---------|-------|---------|
| Presentational | Render data, emit events | No internal state | Badge, Avatar, Skeleton |
| Container | Fetch/manage data, orchestrate | Owns state | UserList, DashboardPanel |
| Compound | Family of related sub-components | Shared context | Tabs, Accordion, Select |
| Layout | Structural arrangement | Minimal | Stack, Grid, Sidebar |
| Utility | Provide behavior, no visible output | Internal state | ErrorBoundary, FocusTrap |

### Server vs. client component boundaries (Next.js)

Push \`"use client"\` as deep as possible. The pattern:

\`\`\`
ServerPage (fetches data)
  └─ ServerLayout (no JS shipped)
       ├─ StaticContent (server)
       └─ InteractiveWidget (client — "use client")
            ├─ useState, useEffect
            └─ Event handlers
\`\`\`

## Workflow

### 1. Classify the component

Before writing code, classify: is this presentational, container, compound, layout, or utility? The classification determines the file location, state management, and testing strategy.

### 2. Build compound components with context

\`\`\`tsx
import { createContext, useContext, useState } from "react";

type TabsContextValue = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs compound components must be used within <Tabs>");
  return ctx;
}

function Tabs({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }: { children: React.ReactNode }) {
  return <div role="tablist" className="flex gap-space-sm border-b border-border">{children}</div>;
}

function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useTabsContext();
  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
      className={activeTab === value ? "border-b-2 border-accent font-medium" : "text-text-secondary"}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null;
  return <div role="tabpanel" className="p-space-md">{children}</div>;
}

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export { Tabs };
\`\`\`

**Usage:**
\`\`\`tsx
<Tabs defaultTab="overview">
  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview">Overview content</Tabs.Panel>
  <Tabs.Panel value="settings">Settings content</Tabs.Panel>
</Tabs>
\`\`\`

### 3. Extract reusable logic into custom hooks

\`\`\`tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStored(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [stored, setValue];
}
\`\`\`

### 4. State management decision tree

| Need | Solution |
|------|----------|
| Local UI state (toggle, form input) | \`useState\` |
| Complex local state (reducer pattern) | \`useReducer\` |
| Cross-cutting concern (theme, auth, locale) | React Context |
| Server state (API data) | React Query / SWR / Server Components |
| URL state (search params, filters) | \`useSearchParams\` / URL |
| Global client state (rare) | Zustand (lightweight) or Jotai (atomic) |

### 5. File organization

\`\`\`
components/
  ui/               # generic primitives (Button, Input, Badge, Skeleton)
  features/         # domain-specific (SkillCard, UserProfile, DashboardPanel)
  layouts/          # page structure (Sidebar, Header, PageShell)
  compound/         # compound components (Tabs, Accordion, Select)
hooks/              # custom hooks (useDebounce, useMediaQuery, useLocalStorage)
lib/                # utilities, helpers, constants
  constants/        # domain-level constants
  utils/            # pure functions
types/              # shared TypeScript types
\`\`\`

## Examples

### Example 1 — Presentational component with typed props

\`\`\`tsx
type BadgeVariant = "default" | "success" | "warning" | "error";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-sunken text-text-secondary",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
};

function Badge({ variant = "default", children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={\`inline-flex items-center rounded-pill px-space-sm py-0.5 text-xs font-medium \${variantClasses[variant]}\`}>
      {children}
    </span>
  );
}
\`\`\`

### Example 2 — Container component with data fetching

\`\`\`tsx
import { useQuery } from "@tanstack/react-query";

function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
  });

  if (isLoading) return <UserListSkeleton />;
  if (error) return <ErrorState message="Failed to load users" />;

  return (
    <ul className="divide-y divide-border">
      {users.map((user: User) => (
        <li key={user.id} className="py-space-sm">
          <UserRow user={user} />
        </li>
      ))}
    </ul>
  );
}
\`\`\`

### Example 3 — Server/client boundary pattern

\`\`\`tsx
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const stats = await getStats();
  return (
    <div>
      <h1>Dashboard</h1>
      <StatsDisplay stats={stats} />
      <InteractiveFilters />   {/* "use client" component */}
    </div>
  );
}

// components/features/InteractiveFilters.tsx
"use client";
import { useState, startTransition } from "react";

export function InteractiveFilters() {
  const [filter, setFilter] = useState("");
  return (
    <input
      value={filter}
      onChange={(e) => {
        const v = e.target.value;
        setFilter(v);
        startTransition(() => { /* trigger server re-fetch */ });
      }}
    />
  );
}
\`\`\`

## Decision tree

- **Simple display, no state?** → Presentational component
- **Fetches data and manages loading/error?** → Container component
- **Multiple related sub-components with shared state?** → Compound component with context
- **Reusable logic across components?** → Custom hook
- **Page structure?** → Layout component
- **Context or prop drilling?** → Context for cross-cutting concerns; props for 1-2 levels
- **Server or client data?** → Server Components for display, React Query for client cache
- **Where to put state?** → See the state management table above

## Edge cases and gotchas

1. **Context overuse** — Not every shared state needs context. If the data only passes through 1-2 levels, props are simpler and more explicit.
2. **Compound component error messages** — Always throw a descriptive error when compound sub-components are used outside their parent context.
3. **Hook dependency arrays** — Missing dependencies cause stale closures. Use the exhaustive-deps ESLint rule and fix warnings instead of suppressing them.
4. **Server component imports** — A Server Component cannot import a Client Component that uses \`useState\`. But a Client Component can render Server Components as children.
5. **Over-abstraction** — Do not create a generic component until you have 3+ concrete use cases. Premature abstraction creates rigid, hard-to-change APIs.
6. **Testing strategy by type** — Presentational: snapshot + visual. Container: integration with mocked data. Compound: interaction tests. Hooks: \`renderHook\` tests.

## Evaluation criteria

- [ ] Composition is preferred over configuration (no prop-heavy monolithic components)
- [ ] Compound components use context with descriptive error messages
- [ ] Custom hooks extract reusable logic (one concern per hook)
- [ ] State is lifted only as high as needed (not higher)
- [ ] Server/client boundaries are pushed as deep as possible
- [ ] File organization follows the category structure (ui, features, layouts, compound, hooks)
- [ ] Each file has one primary export
- [ ] Context is used for cross-cutting concerns, not for avoiding 1-2 levels of prop passing
- [ ] Server state uses React Query/SWR, not \`useState\` + \`useEffect\`
- [ ] URL state for shareable UI state (filters, search, pagination)`,
    agentDocs: {
      codex: `# Codex — React Component Architecture

## Environment
Sandboxed, file I/O only. No browser or React DevTools — ensure components compile and follow structural patterns.

## When this skill is active
- Prefer composition over heavy prop APIs.
- Extract reusable logic into custom hooks — one concern per hook.
- Lift state only as high as needed — not higher.
- Use context for cross-cutting concerns (theme, auth, locale), not for avoiding 1-2 levels of prop drilling.
- Keep components in focused files — one primary export per file.

## Tool usage
- Place presentational components in \`components/ui/\`.
- Place domain-specific components in \`components/features/\`.
- Place compound components in \`components/compound/\`.
- Place custom hooks in \`hooks/\` — one hook per file.
- Place shared types in \`types/\`.

## Testing expectations
- Presentational components: snapshot tests for visual output.
- Container components: integration tests with mocked data.
- Compound components: interaction tests verifying state sharing.
- Custom hooks: \`renderHook\` tests with act() for state updates.
- Every component should have at least one test.

## Common failure modes
- Monolithic component with 15+ props instead of composition.
- State lifted to the app root when it is only needed in a subtree.
- Custom hook with multiple unrelated concerns (should be split).
- Missing error boundary for compound component context.
- Server Component importing client-only code (useState, useEffect).
- Over-abstraction: creating a generic component from a single use case.

## Output format
- One file per component with a single primary export.
- Compound components: context, sub-components, and parent in one file (or a folder).
- Custom hooks: one file per hook in \`hooks/\`.
- Types: co-located with the component or in \`types/\` if shared.`,
      cursor: `# Cursor — React Component Architecture

## IDE context
Cursor provides TypeScript support for React component props, context types, and hook signatures.

## Rules for code generation
- Compound components use \`React.createContext\` for shared state with a \`useXContext\` hook.
- Presentational components should have zero side effects — pure functions of props.
- Custom hooks start with \`use\` and encapsulate a single concern.
- Server state (API data) goes in React Query / SWR, not \`useState\` + \`useEffect\` fetch pattern.
- URL params for shareable state (\`useSearchParams\`), \`localStorage\` for persistence.

## Code style
- Typed props interfaces: \`type CardProps = { ... }\` above the component.
- Variant maps: \`Record<Variant, string>\` for class name mappings.
- Hook return types explicitly typed when non-obvious.
- \`cn()\` or \`clsx()\` for conditional class composition.

## Cursor features to leverage
- TypeScript autocompletion for props, context values, and hook return types.
- Go-to-definition to navigate compound component internals.
- Multi-file editing to refactor component + hook simultaneously.
- Code actions to extract selected JSX into a new component.

## Review checklist
- [ ] Composition preferred over configuration
- [ ] Compound components have context error messages
- [ ] Custom hooks are single-concern
- [ ] State boundaries are appropriate (not over-lifted)
- [ ] File organization matches component category
- [ ] Server/client boundaries are correct`,
      claude: `# Claude — React Component Architecture

## Interaction patterns
When a user asks about component design:
1. Classify the component type (presentational, container, compound, layout, utility).
2. Determine the state management pattern needed.
3. Provide a complete implementation with types, context (if compound), and usage example.
4. Include the testing strategy for that component type.

## Response structure
1. **Assessment** — What component type? What state pattern?
2. **Plan** — Classification → interface design → implementation → state boundaries → testing
3. **Implementation** — Complete component with types, context/hooks, and usage example
4. **Verification** — Does the architecture follow the evaluation criteria?

## Chain-of-thought guidance
- Think about who uses this component and what they need to customize.
- Consider the 3-use-case rule: do not abstract until there are 3+ concrete use cases.
- Think about the testing story: how would you test this component in isolation?
- Consider the server/client boundary: does this need interactivity or can it be server-rendered?

## Output formatting
- Show the component type classification before the code.
- Include TypeScript types for all props and context values.
- Show the usage example after the implementation.
- Include the file path where the component should live.
- Show the testing approach as a brief note after the implementation.

## Constraints
- Never suggest a monolithic component with 10+ props when composition is possible.
- Never use context for data that only passes through 1-2 levels.
- Never create abstractions from a single use case.
- Always include error boundaries for compound component context.
- Always type hook return values when non-obvious.`,
      agents: `# AGENTS.md — React Component Architecture

## Purpose
Ensure React components are composable, well-typed, properly state-managed, and organized for long-term maintainability.

## Review checklist
1. Is composition preferred over configuration (no monolithic prop-heavy components)?
2. Do compound components use context with descriptive error messages for misuse?
3. Do custom hooks encapsulate exactly one concern?
4. Is state lifted only as high as needed (no unnecessary global state)?
5. Are server/client boundaries pushed as deep as possible into the tree?
6. Does file organization follow the category structure (ui, features, layouts, compound)?
7. Does each file have one primary export?
8. Is context reserved for cross-cutting concerns (not replacing 1-2 levels of props)?
9. Does server state use React Query/SWR instead of useState + useEffect fetch?
10. Are all component interfaces typed with explicit TypeScript types?

## Quality gates
- **Type safety**: all props, context values, and hook returns are typed.
- **Single responsibility**: each component does one thing well.
- **Testability**: every component type has an appropriate testing strategy.
- **No premature abstraction**: generic components exist only when 3+ use cases justify them.

## Related skills
- Next.js Patterns — for server/client component boundaries
- Framer Motion — for animated component patterns
- Accessible UI — for ensuring components are keyboard and screen reader accessible
- Tailwind Design System — for token-based component styling

## Escalation criteria
- If state management becomes complex across many components, evaluate Zustand or Jotai.
- If compound component APIs become unwieldy, consider Headless UI or Radix primitives.
- If component count exceeds 100, establish a formal component documentation system.`
    }
  },
];
