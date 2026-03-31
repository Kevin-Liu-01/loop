import type { CreateSkillInput } from "@/lib/db/skills";

type SeedSkill = Omit<CreateSkillInput, "origin"> & {
  origin?: CreateSkillInput["origin"];
};

export const containers: SeedSkill[] = [
  // -----------------------------------------------------------------------
  // 1. Dockerfile Mastery
  // -----------------------------------------------------------------------
  {
    slug: "dockerfile-mastery",
    title: "Dockerfile Mastery",
    description:
      "Multi-stage builds, layer optimization, caching, security hardening, and production-ready Dockerfile patterns for Node.js and web applications.",
    category: "containers",
    accent: "signal-red",
    tags: ["docker", "dockerfile", "multi-stage", "optimization", "containers"],
    body: `# Dockerfile Mastery

Production-grade Dockerfile authoring for Node.js and web applications.
Covers multi-stage builds, layer-cache optimization, security hardening,
size reduction, and CI-friendly patterns that keep images small, fast to
build, and safe to ship.

## When to use

- Building a Docker image for any Node.js, Next.js, or frontend project
- Optimizing an existing Dockerfile that is slow to build or produces large images
- Hardening an image for production deployment (non-root, minimal attack surface)
- Setting up CI pipelines that need reproducible, cache-friendly Docker builds
- Migrating from a single-stage Dockerfile to a multi-stage build

## When NOT to use

- The project runs on a managed platform that handles containerization (e.g. Vercel, Netlify) — skip Docker entirely
- You need full OS-level customization — use Packer or a VM image builder instead
- The application is a static site with no server process — a CDN deploy is simpler than a container
- Kubernetes pod configuration — reach for the kubernetes-essentials skill

## Core concepts

| Concept | Description |
|---------|-------------|
| Build stage | A named \\\`FROM\\\` block that produces intermediate artifacts; only the final stage ships |
| Layer cache | Docker caches each instruction; reordering instructions keeps cache hits high |
| .dockerignore | Excludes files from the build context to speed up \\\`COPY\\\` and reduce image size |
| Distroless / slim | Minimal base images with no shell or package manager — smaller, fewer CVEs |
| BuildKit | Modern Docker build engine with parallel stage execution and better caching |
| HEALTHCHECK | Built-in instruction that lets Docker monitor container health |
| Multi-platform | Building for linux/amd64 and linux/arm64 from a single Dockerfile |

## Workflow

### Step 1: Choose a base image strategy

Pick the smallest base image that satisfies runtime requirements.

| Base image | Compressed size | Use when |
|------------|----------------|----------|
| \\\`node:22-alpine\\\` | ~50 MB | Default for most Node.js services |
| \\\`node:22-slim\\\` | ~75 MB | Need glibc or native deps that fail on musl |
| \\\`gcr.io/distroless/nodejs22\\\` | ~40 MB | Maximum security — no shell, no package manager |
| \\\`scratch\\\` | 0 MB | Fully static binaries only |

### Step 2: Structure the multi-stage build

Separate dependency installation, build, and runtime into distinct stages.
Copy only production artifacts into the final stage.

### Step 3: Optimize layer ordering

Place instructions that change least frequently at the top:

1. Base image
2. System packages
3. Copy lockfile → install deps
4. Copy source → build
5. Copy build output into final stage

### Step 4: Add security hardening

- Run as a non-root user
- Drop all Linux capabilities
- Set read-only filesystem where possible
- Pin base image digests for reproducibility

### Step 5: Write a comprehensive .dockerignore

Exclude everything that is not needed in the build context.

## Examples

### Example 1: Production Next.js multi-stage Dockerfile

\\\`\\\`\\\`dockerfile
# syntax=docker/dockerfile:1

# ---- Stage 1: Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && \\
    pnpm install --frozen-lockfile --prod=false

# ---- Stage 2: Build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable pnpm && pnpm run build

# ---- Stage 3: Production runner ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 appgroup && \\
    adduser --system --uid 1001 appuser

COPY --from=build /app/public ./public
COPY --from=build --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=build --chown=appuser:appgroup /app/.next/static ./.next/static

USER appuser
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
\\\`\\\`\\\`

### Example 2: .dockerignore template

\\\`\\\`\\\`text
node_modules
.next
.git
.github
.vscode
.env*
*.md
!README.md
Dockerfile*
docker-compose*
.dockerignore
coverage
.turbo
dist
.cache
*.log
\\\`\\\`\\\`

### Example 3: Size optimization comparison

| Strategy | Image size | Build time |
|----------|-----------|------------|
| Single-stage node:22 | 1.2 GB | 90 s |
| Single-stage node:22-alpine | 450 MB | 85 s |
| Multi-stage node:22-alpine | 180 MB | 95 s |
| Multi-stage + standalone output | 120 MB | 95 s |
| Multi-stage + distroless | 95 MB | 100 s |

### Example 4: CI security scanning workflow

\\\`\\\`\\\`yaml
# .github/workflows/docker-scan.yml
name: Docker Build & Scan
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build image
        uses: docker/build-push-action@v6
        with:
          context: .
          load: true
          tags: app:scan
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: app:scan
          format: table
          exit-code: 1
          severity: CRITICAL,HIGH

      - name: Run Snyk scan
        uses: snyk/actions/docker@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        with:
          image: app:scan
          args: --severity-threshold=high
\\\`\\\`\\\`

## Decision tree

- Image is too large → switch to alpine or distroless base; enable standalone output for Next.js
- Build is slow → reorder layers so lockfile copy + install comes before source copy; use BuildKit cache mounts
- CVEs in base image → pin a patched digest; run \\\`docker scout cves\\\` or Trivy in CI
- Need native modules (sharp, bcrypt) → use node-slim instead of alpine; install build-essential in a builder stage only
- Reproducibility matters → pin base image by digest, not tag; use \\\`--frozen-lockfile\\\`
- Multi-platform needed → use \\\`docker buildx build --platform linux/amd64,linux/arm64\\\`

## Edge cases and gotchas

1. **Alpine + native modules** — musl libc breaks some native Node addons (sharp, canvas). Mitigation: use \\\`node:22-slim\\\` or install \\\`libc6-compat\\\` on alpine.
2. **pnpm + corepack** — Docker images ship with corepack but it must be explicitly enabled. Always run \\\`corepack enable pnpm\\\` before install.
3. **Next.js standalone misses public/** — the standalone output does not copy \\\`public/\\\` or \\\`.next/static\\\`. You must COPY them explicitly in the Dockerfile.
4. **COPY invalidates cache on any file change** — a stale \\\`.env.local\\\` in context can bust the layer cache. Keep \\\`.dockerignore\\\` strict.
5. **BuildKit not enabled by default** — set \\\`DOCKER_BUILDKIT=1\\\` or use \\\`docker buildx build\\\` to get parallel stage execution and cache mounts.
6. **HEALTHCHECK vs orchestrator probes** — Kubernetes ignores HEALTHCHECK; use it only for standalone Docker or Docker Compose. For K8s, define livenessProbe/readinessProbe in the pod spec.
7. **Layer squashing loses cache** — \\\`--squash\\\` reduces size but makes rebuilds slower. Prefer multi-stage over squashing.

## Evaluation criteria

- [ ] Final image is under 200 MB for a typical Next.js app
- [ ] Container runs as a non-root user
- [ ] No secrets or .env files baked into any layer
- [ ] \\\`docker build\\\` with warm cache completes in under 30 seconds
- [ ] Trivy or Snyk scan returns zero CRITICAL vulnerabilities
- [ ] .dockerignore excludes node_modules, .git, .env*, and test artifacts
- [ ] Base image is pinned by digest or a specific minor version tag
- [ ] HEALTHCHECK or orchestrator probe is configured`,
    agentDocs: {
      codex: `# Codex — Dockerfile Mastery

## Environment
- Codex runs in a sandboxed environment with file I/O and shell access
- Docker daemon may not be available — generate and validate Dockerfiles textually
- Working directory is the project root
- Network access may be restricted — prefer local validation over remote pulls

## When this skill is active
- Generate multi-stage Dockerfiles following the layer-ordering strategy in the skill body
- Always include a .dockerignore when creating a new Dockerfile
- Default to node:22-alpine unless native modules require node-slim
- Add non-root USER and HEALTHCHECK to every production Dockerfile
- Pin base images by digest for reproducible builds
- Use BuildKit syntax header (\`# syntax=docker/dockerfile:1\`) in every Dockerfile
- Separate dependency install from source copy for optimal caching

## Tool usage
- Use file write to create or update Dockerfile and .dockerignore
- Use shell to run \`docker build --check\` if the daemon is available
- Validate YAML CI configs with a dry-run parse when possible
- Run \`hadolint Dockerfile\` to lint for Dockerfile best practices

## Testing expectations
- After generating a Dockerfile, verify it has: multi-stage, non-root user, HEALTHCHECK, no COPY of secrets
- Run \`hadolint Dockerfile\` if available to lint for best practices
- Confirm .dockerignore excludes node_modules, .git, .env*
- Verify the final stage does not contain build toolchains or dev dependencies

## Common failure modes
- Alpine + native deps: detect sharp/canvas/bcrypt in package.json and switch to slim
- Missing standalone copy: always copy public/ and .next/static for Next.js standalone
- Cache busting: ensure lockfile COPY precedes full source COPY
- COPY --from wrong stage name: double-check stage names match between FROM and COPY

## Output format
- Write Dockerfile and .dockerignore directly
- Summarize image size strategy and security measures in the response
- Include a before/after size comparison when optimizing an existing Dockerfile
- Flag any detected CVE risk from base image choice`,
      cursor: `# Cursor — Dockerfile Mastery

## IDE context
- Full project access via file editing, terminal, and search
- Linter feedback is available in real time for YAML and Dockerfile
- Docker and hadolint CLI may be available in the integrated terminal
- Can run builds and scans directly from the terminal pane

## When this skill applies
- Use multi-stage builds for every production Dockerfile
- Order layers from least-changing to most-changing for cache efficiency
- Default to alpine; switch to slim only when native modules fail on musl
- Always include a .dockerignore alongside the Dockerfile
- Add non-root USER, HEALTHCHECK, and ENV NODE_ENV=production
- Use BuildKit cache mounts for package manager caches
- Check package.json for native modules before choosing the base image

## Code style
- Use \`# ---- Stage: Name ----\` comments to label each build stage
- Pin versions explicitly: \`FROM node:22-alpine\` not \`FROM node:latest\`
- Group related RUN commands with \`&&\` to minimize layers
- Use COPY --chown for files that the non-root user needs
- Place ARG declarations immediately after the FROM they belong to

## Cursor features to leverage
- Search for existing Dockerfile patterns in the project before creating new ones
- Use multi-file edit to update Dockerfile, .dockerignore, and CI config together
- Check terminal output for hadolint warnings after edits
- Inspect package.json dependencies to detect alpine-incompatible native modules

## Review checklist
- [ ] Multi-stage build separates deps, build, and runtime
- [ ] Layer ordering maximizes cache hits
- [ ] Non-root user is configured with explicit UID/GID
- [ ] No secrets or .env files in any COPY instruction
- [ ] .dockerignore exists and is comprehensive
- [ ] Base image version is pinned (not \`latest\`)
- [ ] HEALTHCHECK instruction is present in the final stage`,
      claude: `# Claude — Dockerfile Mastery

## Interaction patterns
- When the user asks to "dockerize" a project, apply this skill to generate a production-ready Dockerfile
- Ask what base image constraints exist (alpine vs slim vs distroless) before generating
- Ask whether CI scanning integration is desired

## Response structure
1. **Assessment** — identify the project type (Next.js, Express, static) and native dep requirements
2. **Plan** — outline the multi-stage strategy and base image choice with rationale
3. **Implementation** — generate Dockerfile, .dockerignore, and optional CI scanning config
4. **Verification** — provide commands to build, scan, and verify the image

## Chain-of-thought guidance
- Check package.json for native modules (sharp, bcrypt, canvas) before choosing alpine
- Consider output mode (standalone for Next.js, dist for plain Node)
- Think about layer ordering for cache efficiency before writing instructions
- Flag tradeoffs between image size and build complexity

## Output formatting
- Use dockerfile language tag for Dockerfile code blocks
- Use yaml for CI pipeline examples
- Use a comparison table when discussing base image tradeoffs
- Reference specific Dockerfile lines when explaining optimization decisions

## Constraints
- Never bake secrets or .env files into Docker layers
- Always use non-root USER in the final stage
- Pin base images to specific versions, not \`latest\`
- Prefer BuildKit syntax header (\`# syntax=docker/dockerfile:1\`)`,
      agents: `# AGENTS.md — Dockerfile Mastery

## Purpose
Ensure every Dockerfile produced follows multi-stage, security-hardened, cache-optimized patterns for Node.js and web applications.

## Review checklist
1. Dockerfile uses multi-stage build with named stages (deps → build → runner)
2. Layer ordering: lockfile COPY + install before source COPY
3. Final stage runs as non-root user with explicit UID/GID
4. No secrets, .env files, or unnecessary dev dependencies in the final image
5. Base image is pinned to a specific version (not \`latest\`)
6. HEALTHCHECK or orchestrator probe is configured
7. .dockerignore exists and excludes node_modules, .git, .env*, test artifacts
8. BuildKit syntax header is present
9. RUN commands are grouped with && to minimize layers
10. COPY --chown is used for files owned by the non-root user

## Quality gates
- Final image size is under 200 MB for a standard Next.js app
- \`hadolint\` reports zero errors and zero warnings above DL3000 level
- Trivy or Snyk scan returns zero CRITICAL vulnerabilities
- \`docker build\` with warm cache completes in under 30 seconds

## Related skills
- kubernetes-essentials: deployment YAML, probes, and resource limits for containerized apps
- container-security: Snyk/Trivy scanning pipelines, runtime policies, SBOM generation

## Escalation criteria
- Escalate to a human when the project requires custom native build toolchains not covered by standard Node images
- Escalate when the target registry requires signing or attestation beyond cosign basics
- Escalate when multi-platform builds (amd64 + arm64) fail due to architecture-specific dependencies`
    },
  },

  // -----------------------------------------------------------------------
  // 2. Kubernetes Essentials
  // -----------------------------------------------------------------------
  {
    slug: "kubernetes-essentials",
    title: "Kubernetes Essentials",
    description:
      "Pods, services, deployments, ingress, ConfigMaps, health checks, and resource management for Kubernetes-based deployments.",
    category: "containers",
    accent: "signal-red",
    tags: ["kubernetes", "k8s", "pods", "deployments", "orchestration"],
    body: `# Kubernetes Essentials

Everything you need to deploy, expose, scale, and maintain containerized
applications on Kubernetes. Covers core resource types, health probes,
resource tuning, autoscaling, namespace isolation, and production-ready
YAML patterns.

## When to use

- Deploying a containerized application to any Kubernetes cluster (EKS, GKE, AKS, k3s)
- Configuring health checks, readiness gates, and graceful shutdown
- Tuning CPU and memory requests/limits for predictable scheduling
- Setting up horizontal pod autoscaling (HPA)
- Exposing services via ClusterIP, NodePort, LoadBalancer, or Ingress
- Isolating workloads with namespaces, NetworkPolicies, and RBAC

## When NOT to use

- The application is serverless or runs on a managed platform (Vercel, Lambda) — no Kubernetes needed
- You only need to run a container locally — use Docker Compose instead
- The cluster itself needs provisioning (Terraform, Pulumi) — reach for an IaC skill instead
- Container image authoring — reach for the dockerfile-mastery skill

## Core concepts

| Concept | Description |
|---------|-------------|
| Pod | Smallest deployable unit; one or more containers sharing network and storage |
| Deployment | Declarative desired state for a set of Pods with rolling update strategy |
| Service | Stable network endpoint that load-balances traffic to a set of Pods |
| Ingress | HTTP/HTTPS routing rules that map external hostnames to Services |
| ConfigMap | Non-confidential key-value configuration injected into Pods |
| Secret | Base64-encoded sensitive data (tokens, passwords) injected into Pods |
| HPA | Horizontal Pod Autoscaler — scales replicas based on CPU, memory, or custom metrics |
| Namespace | Logical isolation boundary for resources, RBAC, and network policies |
| NetworkPolicy | Firewall rules controlling pod-to-pod and pod-to-external traffic |
| PodDisruptionBudget | Guarantees minimum available replicas during voluntary disruptions |

## Workflow

### Step 1: Define the Deployment

Declare the desired state: image, replicas, resource requests/limits,
environment variables, and rolling update strategy.

### Step 2: Configure health probes

Add livenessProbe (restart on failure), readinessProbe (remove from
service until ready), and optionally startupProbe (slow-starting apps).

### Step 3: Create the Service

Expose the Deployment inside the cluster with a ClusterIP Service.
Use NodePort or LoadBalancer only when external access is needed without
an Ingress controller.

### Step 4: Add Ingress for HTTP routing

Map hostnames and paths to Services. Configure TLS termination with
cert-manager or a cloud load balancer.

### Step 5: Tune resources and autoscaling

Set CPU/memory requests and limits. Add an HPA to scale on utilization
thresholds. Add a PodDisruptionBudget for safe rollouts.

### Step 6: Isolate with namespaces and network policies

Create a namespace per environment or team. Apply NetworkPolicies to
restrict traffic to only what is explicitly allowed.

## Examples

### Example 1: Production Deployment with probes and security

\\\`\\\`\\\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      terminationGracePeriodSeconds: 30
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: web-app
          image: ghcr.io/org/web-app:sha-abc1234
          ports:
            - name: http
              containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: web-app-secrets
                  key: database-url
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /api/health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 15
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
          startupProbe:
            httpGet:
              path: /api/health
              port: http
            periodSeconds: 5
            failureThreshold: 12
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 5"]
\\\`\\\`\\\`

### Example 2: Service + Ingress with TLS

\\\`\\\`\\\`yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: web-app
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
      secretName: web-app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-app
                port:
                  name: http
\\\`\\\`\\\`

### Example 3: HPA + PodDisruptionBudget

\\\`\\\`\\\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 20
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 25
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-app
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web-app
\\\`\\\`\\\`

## Decision tree

- Single container, no scaling → Deployment with 1 replica + ClusterIP Service
- HTTP traffic from the internet → Add Ingress with TLS; use cert-manager for automatic certs
- Need auto-scaling → Add HPA targeting 70% CPU; set minReplicas ≥ 2 for availability
- Slow-starting app → Add startupProbe with generous failureThreshold × periodSeconds window
- Multi-tenant cluster → Separate namespaces + NetworkPolicies + ResourceQuotas
- Stateful workload → Use StatefulSet instead of Deployment; attach PersistentVolumeClaims
- Background workers → Use Deployment without a Service; consider Jobs or CronJobs for batch work
- Rolling updates must not drop traffic → Set maxUnavailable: 0 + preStop sleep + readinessProbe

## Edge cases and gotchas

1. **Requests vs limits confusion** — Requests guarantee scheduling; limits cap burst. Setting limits too low causes OOMKill. Setting requests too high wastes cluster resources. Start with requests = p95 observed usage, limits = 2× requests.
2. **Missing readinessProbe** — Without it, Kubernetes sends traffic to Pods before they are ready, causing 502 errors during deployments. Always define a readinessProbe.
3. **preStop hook for zero-downtime deploys** — When a Pod terminates, the endpoint removal and SIGTERM race. A \\\`sleep 5\\\` preStop hook gives the load balancer time to drain connections.
4. **Image tag \\\`latest\\\` in production** — Kubernetes caches images by tag. \\\`latest\\\` can silently serve stale code. Always use immutable tags (SHA or semver).
5. **HPA + manual replica count conflict** — If you set \\\`replicas: 3\\\` in the Deployment and also use HPA, the HPA controls replicas. Remove \\\`replicas\\\` from the Deployment spec or use Kustomize to strip it.
6. **ConfigMap/Secret updates don't restart Pods** — Changes to a ConfigMap or Secret are not automatically detected. Use a hash annotation on the Pod template or a reloader controller.
7. **Namespace-scoped vs cluster-scoped resources** — Ingress, Services, Deployments are namespaced. ClusterRole, ClusterRoleBinding, IngressClass are cluster-scoped. Getting this wrong causes \\\`not found\\\` errors.
8. **ResourceQuota blocking deployments** — If a namespace has a ResourceQuota and your Pod spec lacks resource requests, admission is denied. Always set requests and limits when quotas are enabled.

## Evaluation criteria

- [ ] Deployment has resource requests and limits on every container
- [ ] livenessProbe, readinessProbe, and (if needed) startupProbe are configured
- [ ] Pods run as non-root with a securityContext
- [ ] Images are tagged with immutable references (SHA digest or semver), never \\\`latest\\\`
- [ ] Ingress has TLS configured with cert-manager or equivalent
- [ ] HPA is present for user-facing workloads with minReplicas ≥ 2
- [ ] PodDisruptionBudget ensures availability during node drains
- [ ] Secrets are mounted from Secret resources, not hardcoded in YAML`,
    agentDocs: {
      codex: `# Codex — Kubernetes Essentials

## Environment
- Codex runs in a sandboxed environment; kubectl is typically unavailable
- Generate YAML manifests as files; do not attempt to apply them
- Working directory is the project root
- Network access may be restricted — no cluster connectivity expected

## When this skill is active
- Generate Deployment, Service, Ingress, HPA, and PDB manifests following the patterns in the skill body
- Always include resource requests and limits on every container spec
- Always add livenessProbe, readinessProbe, and startupProbe where appropriate
- Default to ClusterIP for Services; add Ingress for HTTP routing
- Use immutable image tags (SHA or semver), never \`latest\`
- Include securityContext with runAsNonRoot and seccompProfile on every Pod
- Add preStop lifecycle hook for zero-downtime deployments

## Tool usage
- Use file write to create YAML manifests in a k8s/ or deploy/ directory
- Use shell to validate YAML with \`kubectl --dry-run=client -f\` if available
- Group related resources in a single file separated by \`---\`
- Prefer kustomize overlays for environment-specific configuration

## Testing expectations
- After generating manifests, verify they have: resource limits, probes, non-root securityContext
- Validate YAML syntax with a linter or dry-run parse
- Check that namespace references are consistent across all manifests
- Ensure label selectors match between Deployment, Service, and HPA

## Common failure modes
- Missing readinessProbe causing 502s during rolling updates: always include one
- HPA conflicting with explicit replica count: omit replicas when HPA is present
- ConfigMap changes not triggering Pod restart: add a hash annotation or mention reloader
- Mismatched label selectors between Deployment and Service: verify app labels

## Output format
- Write YAML files directly to the project
- Summarize the resource topology (Deployment → Service → Ingress) in the response
- Flag any detected misconfiguration or missing best practice
- Include kubectl commands to verify the deployment after apply`,
      cursor: `# Cursor — Kubernetes Essentials

## IDE context
- Full project access via file editing, terminal, and search
- kubectl may be available in the integrated terminal for validation
- YAML language support provides schema-aware autocomplete
- Can diff manifests against live cluster state via \`kubectl diff\`

## When this skill applies
- Generate production-grade Kubernetes YAML following the patterns in the skill body
- Always include resource requests/limits, health probes, and securityContext
- Use named ports and reference them consistently across Deployment, Service, and Ingress
- Add HPA for workloads that receive variable traffic
- Use namespaces to isolate environments (staging, production)
- Include PodDisruptionBudget for user-facing services with multiple replicas
- Add preStop hook and terminationGracePeriodSeconds for graceful shutdown

## Code style
- Use \`---\` to separate multiple resources in a single YAML file
- Label every resource with \`app\` and \`version\` labels for consistent selection
- Use valueFrom for all secrets — never inline sensitive values
- Comment non-obvious configuration choices (e.g., why terminationGracePeriodSeconds is 30)
- Use consistent 2-space indentation for all YAML files

## Cursor features to leverage
- Search for existing k8s manifests before creating new ones
- Use multi-file edit to update related Deployment, Service, and Ingress together
- Validate YAML in terminal with \`kubectl apply --dry-run=client -f\`
- Check for label selector consistency across manifests using search

## Review checklist
- [ ] Every container has resource requests and limits
- [ ] Health probes (liveness, readiness, startup) are configured
- [ ] Pods run as non-root with seccompProfile: RuntimeDefault
- [ ] Images use immutable tags, not \`latest\`
- [ ] Secrets use valueFrom secretKeyRef, not plaintext
- [ ] HPA minReplicas ≥ 2 for user-facing services
- [ ] PodDisruptionBudget guarantees minimum availability
- [ ] preStop hook is present for zero-downtime deploys`,
      claude: `# Claude — Kubernetes Essentials

## Interaction patterns
- When the user asks to "deploy to Kubernetes," apply this skill to generate manifests
- Ask about the target cluster (cloud provider, ingress controller, cert-manager) before generating
- Ask about scaling requirements and availability targets

## Response structure
1. **Assessment** — identify the workload type (web, worker, cron) and exposure requirements
2. **Plan** — outline which K8s resources are needed and why
3. **Implementation** — generate YAML manifests with inline explanations
4. **Verification** — provide kubectl commands to apply, verify, and debug

## Chain-of-thought guidance
- Consider the deployment strategy (RollingUpdate vs Recreate) based on the app's constraints
- Think about graceful shutdown: does the app handle SIGTERM? Does it need a preStop hook?
- Evaluate whether the app is stateless (Deployment) or stateful (StatefulSet)
- Consider network isolation: does this workload need to talk to everything or just specific services?

## Output formatting
- Use yaml language tags for all Kubernetes manifests
- Separate resources with \`---\` in a single block or explain multi-file layout
- Use tables for resource sizing recommendations
- Reference specific YAML paths when explaining configuration choices

## Constraints
- Never hardcode secrets in YAML manifests
- Always set securityContext with runAsNonRoot: true
- Never use image tag \`latest\` in production manifests
- Prefer cert-manager for TLS over manual certificate management`,
      agents: `# AGENTS.md — Kubernetes Essentials

## Purpose
Ensure every Kubernetes manifest follows production-grade patterns for availability, security, and observability.

## Review checklist
1. Every container has resource requests and limits defined
2. livenessProbe and readinessProbe are configured on all containers
3. startupProbe is present for slow-starting applications
4. Pods run as non-root with securityContext.runAsNonRoot: true
5. seccompProfile is set to RuntimeDefault on every Pod
6. Images use immutable tags (SHA or semver), never \`latest\`
7. Secrets are referenced via secretKeyRef, not hardcoded
8. HPA is present for variable-traffic workloads with minReplicas ≥ 2
9. PodDisruptionBudget guarantees availability during node drains
10. Ingress has TLS configured via cert-manager
11. preStop lifecycle hook is present for graceful shutdown
12. Label selectors are consistent across Deployment, Service, and Ingress

## Quality gates
- \`kubectl apply --dry-run=client\` passes without errors on all manifests
- All Pods have a securityContext with runAsNonRoot and seccompProfile
- No Secret values are stored in plaintext in the repository
- HPA and Deployment do not conflict on replica count

## Related skills
- dockerfile-mastery: building the container images that these manifests deploy
- container-security: scanning images, runtime policies, and supply chain security

## Escalation criteria
- Escalate to a human when the cluster requires custom operators or CRDs not covered here
- Escalate when StatefulSet with complex storage requirements needs design review
- Escalate when NetworkPolicy design requires understanding of the full service mesh topology`
    },
  },

  // -----------------------------------------------------------------------
  // 3. Snyk Container Security
  // -----------------------------------------------------------------------
  {
    slug: "container-security",
    title: "Snyk Container Security",
    description:
      "Snyk and Trivy image scanning, runtime policies, non-root execution, secrets management, and supply chain security for containers.",
    category: "containers",
    accent: "signal-red",
    tags: ["security", "containers", "scanning", "runtime", "supply-chain"],
    body: `# Snyk Container Security

End-to-end container security covering image scanning, runtime hardening,
secrets management, SBOM generation, image signing, and supply chain
integrity. Uses Snyk and Trivy for vulnerability detection and cosign for
provenance attestation.

## When to use

- Scanning container images for known CVEs before deployment
- Hardening Kubernetes Pod security contexts and runtime policies
- Managing secrets without baking them into container layers
- Generating Software Bills of Materials (SBOM) for compliance
- Signing container images for supply chain verification
- Setting up CI pipelines that block vulnerable images from reaching production

## When NOT to use

- Application-level SAST/DAST scanning — use Snyk Code or Semgrep instead
- Network security and firewall rules — use NetworkPolicies or a service mesh
- Cloud IAM and permissions management — use cloud-provider IAM tools
- Dockerfile authoring best practices — reach for the dockerfile-mastery skill

## Core concepts

| Concept | Description |
|---------|-------------|
| CVE scanning | Checking image layers against vulnerability databases (NVD, GitHub Advisory) |
| SBOM | Software Bill of Materials — a manifest of every package in an image |
| Image signing | Cryptographic proof that an image was built by a trusted pipeline |
| securityContext | Kubernetes Pod/container-level security settings (non-root, capabilities, seccomp) |
| Runtime policy | OPA Gatekeeper or Kyverno rules that enforce security constraints at admission |
| Distroless | Minimal images with no shell or package manager — reduced attack surface |
| Supply chain | The pipeline from source code to running container — every step is an attack surface |
| cosign | Sigstore tool for keyless image signing and verification |
| Trivy | Open-source scanner for vulnerabilities, misconfigurations, and secrets in images |
| Snyk Container | Commercial scanner with fix recommendations, base image suggestions, and CI integration |

## Workflow

### Step 1: Scan images in CI

Integrate Trivy and/or Snyk into the CI pipeline. Fail the build on
CRITICAL or HIGH severity vulnerabilities.

### Step 2: Harden the Kubernetes securityContext

Apply restrictive security settings at both the Pod and container level.
Drop all capabilities and add back only what is needed.

### Step 3: Manage secrets securely

Never bake secrets into image layers. Use Kubernetes Secrets, external
secret operators, or mounted volumes from a secrets manager.

### Step 4: Generate an SBOM

Produce an SPDX or CycloneDX SBOM for every production image. Store it
alongside the image in the registry.

### Step 5: Sign images with cosign

Sign every image after a successful build and scan. Verify signatures
before deployment with a Kyverno or OPA Gatekeeper policy.

### Step 6: Enforce policies at admission

Use Kyverno or OPA Gatekeeper to block Pods that violate security
constraints (e.g., running as root, no resource limits, unsigned images).

## Examples

### Example 1: CI scanning pipeline with Trivy and Snyk

\\\`\\\`\\\`yaml
# .github/workflows/container-security.yml
name: Container Security Pipeline
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-and-scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build image
        uses: docker/build-push-action@v6
        with:
          context: .
          load: true
          tags: app:ci-\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Trivy vulnerability scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: app:ci-\${{ github.sha }}
          format: sarif
          output: trivy-results.sarif
          exit-code: 1
          severity: CRITICAL,HIGH
          timeout: 10m

      - name: Upload Trivy SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-results.sarif

      - name: Snyk container scan
        uses: snyk/actions/docker@master
        continue-on-error: false
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        with:
          image: app:ci-\${{ github.sha }}
          args: --severity-threshold=high --file=Dockerfile

      - name: Generate SBOM
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: app:ci-\${{ github.sha }}
          format: cyclonedx
          output: sbom.cdx.json

      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.cdx.json
\\\`\\\`\\\`

### Example 2: Hardened securityContext for Kubernetes

\\\`\\\`\\\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: secure-app
  template:
    metadata:
      labels:
        app: secure-app
    spec:
      automountServiceAccountToken: false
      securityContext:
        runAsNonRoot: true
        runAsUser: 65534
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: app
          image: ghcr.io/org/secure-app@sha256:abc123...
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          volumeMounts:
            - name: tmp
              mountPath: /tmp
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
      volumes:
        - name: tmp
          emptyDir:
            sizeLimit: 64Mi
\\\`\\\`\\\`

### Example 3: Cosign image signing and verification

\\\`\\\`\\\`yaml
# Signing step in CI (add after successful build + scan)
# Uses keyless signing with GitHub OIDC identity
- name: Install cosign
  uses: sigstore/cosign-installer@v3

- name: Login to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: \${{ github.actor }}
    password: \${{ secrets.GITHUB_TOKEN }}

- name: Push image
  run: |
    docker tag app:ci-\${{ github.sha }} ghcr.io/org/app:\${{ github.sha }}
    docker push ghcr.io/org/app:\${{ github.sha }}

- name: Sign image with cosign (keyless)
  run: cosign sign --yes ghcr.io/org/app:\${{ github.sha }}
  env:
    COSIGN_EXPERIMENTAL: "1"

- name: Attach SBOM to image
  run: |
    cosign attach sbom --sbom sbom.cdx.json \\
      ghcr.io/org/app:\${{ github.sha }}

- name: Verify signature
  run: |
    cosign verify \\
      --certificate-identity-regexp="https://github.com/org/.*" \\
      --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \\
      ghcr.io/org/app:\${{ github.sha }}
\\\`\\\`\\\`

### Example 4: Kyverno policy to enforce image signing

\\\`\\\`\\\`yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-signed-images
spec:
  validationFailureAction: Enforce
  background: false
  rules:
    - name: verify-cosign-signature
      match:
        any:
          - resources:
              kinds: ["Pod"]
              namespaces: ["production"]
      verifyImages:
        - imageReferences: ["ghcr.io/org/*"]
          attestors:
            - entries:
                - keyless:
                    subject: "https://github.com/org/*"
                    issuer: "https://token.actions.githubusercontent.com"
                    rekor:
                      url: https://rekor.sigstore.dev
\\\`\\\`\\\`

## Decision tree

- Need basic vulnerability scanning → start with Trivy (free, fast, covers most cases)
- Need fix recommendations and base image advice → add Snyk Container
- Compliance requires SBOM → generate CycloneDX or SPDX with Trivy; attach to image with cosign
- Supply chain verification needed → sign images with cosign keyless; verify with Kyverno or OPA
- Pods must not run as root → set securityContext.runAsNonRoot + drop ALL capabilities
- App writes to filesystem → use readOnlyRootFilesystem + emptyDir mounts for writable paths
- Secrets needed at runtime → use Kubernetes Secrets with external-secrets-operator or CSI driver
- Need runtime threat detection → deploy Falco for syscall-level anomaly detection

## Edge cases and gotchas

1. **Trivy timeout on large images** — Multi-GB images can exceed default scan timeout. Set \\\`--timeout 15m\\\` or scan the filesystem directly with \\\`trivy fs\\\`.
2. **readOnlyRootFilesystem breaks many apps** — Node.js apps that write to /tmp, log files, or cache directories will crash. Mount emptyDir volumes for writable paths.
3. **cosign keyless requires OIDC** — Keyless signing works automatically in GitHub Actions (via OIDC) but requires manual OIDC provider setup in other CI systems.
4. **Snyk vs Trivy result differences** — Scanners use different vulnerability databases and scoring. Running both catches more issues but can produce conflicting severity ratings. Triage by CVE ID, not by tool.
5. **securityContext at Pod vs container level** — Pod-level settings apply to all containers. Container-level settings override Pod-level. Missing either can leave gaps. Always set both.
6. **Distroless has no shell for debugging** — Use ephemeral debug containers (\\\`kubectl debug\\\`) instead of exec. This is a feature, not a bug — no shell means attackers cannot get a shell.
7. **Secret rotation** — Kubernetes Secrets are not automatically rotated. Use external-secrets-operator with your cloud secrets manager for automatic rotation.
8. **SBOM drift** — An SBOM generated at build time does not reflect runtime changes (e.g., volume-mounted packages). Regenerate SBOMs on every release.

## Evaluation criteria

- [ ] CI pipeline scans every image before push and blocks CRITICAL/HIGH vulnerabilities
- [ ] Kubernetes Pods run with runAsNonRoot, drop ALL capabilities, and use seccompProfile
- [ ] readOnlyRootFilesystem is enabled with emptyDir mounts for writable paths
- [ ] No secrets are baked into image layers (check with \\\`trivy image --scanners secret\\\`)
- [ ] Production images are signed with cosign and signatures are verified at admission
- [ ] SBOM is generated for every production image and stored alongside it
- [ ] Kyverno or OPA Gatekeeper policy enforces signed images in production namespaces
- [ ] automountServiceAccountToken is false unless the workload explicitly needs the K8s API`,
    agentDocs: {
      codex: `# Codex — Container Security

## Environment
- Codex runs in a sandboxed environment; Trivy, Snyk, and cosign CLIs may not be available
- Generate CI pipeline YAML and Kubernetes YAML manifests as files
- Working directory is the project root

## When this skill is active
- Generate CI scanning pipelines with Trivy and/or Snyk for container images
- Apply hardened securityContext to all Kubernetes Deployment manifests
- Configure cosign signing steps in CI workflows
- Generate SBOM with Trivy in CycloneDX format
- Add Kyverno policies for admission-time image verification

## Tool usage
- Use file write to create CI workflow YAML and Kubernetes manifests
- Use shell to validate YAML syntax if a linter is available
- Do not attempt to run Trivy or cosign directly — generate configs only

## Testing expectations
- Verify generated CI YAML has: image build, Trivy scan, Snyk scan, SBOM generation, cosign signing
- Verify Kubernetes manifests have: runAsNonRoot, drop ALL capabilities, readOnlyRootFilesystem
- Check that no Secret values appear in plaintext in any generated file

## Common failure modes
- readOnlyRootFilesystem without emptyDir mounts: detect writable paths and add volumes
- cosign keyless missing OIDC config: ensure id-token: write permission in GitHub Actions
- Trivy timeout: set --timeout flag for images larger than 1 GB

## Output format
- Write CI and Kubernetes YAML files directly
- Summarize the security measures and their purpose in the response
- Flag any gaps in the security posture that require manual remediation`,
      cursor: `# Cursor — Container Security

## IDE context
- Full project access via file editing, terminal, and search
- Terminal can run Trivy scans locally if installed
- YAML language support provides schema-aware autocomplete

## When this skill applies
- Add container scanning steps to CI pipeline YAML files
- Harden Kubernetes securityContext on all Deployment manifests in the project
- Set up cosign signing and verification in CI workflows
- Generate SBOM generation steps in build pipelines
- Create Kyverno or OPA Gatekeeper policies for admission control

## Code style
- Use YAML comments to explain non-obvious security settings
- Group scanning, signing, and SBOM steps together in CI workflows
- Use consistent indentation (2 spaces) for all YAML files
- Reference secrets via GitHub Actions secrets or Kubernetes secretKeyRef

## Cursor features to leverage
- Search for existing CI workflows and Kubernetes manifests before adding security steps
- Use multi-file edit to update all Deployment manifests with securityContext simultaneously
- Run Trivy locally via terminal to validate scan configuration

## Review checklist
- [ ] CI pipeline includes both Trivy and Snyk scans with severity threshold
- [ ] All Deployment manifests have hardened securityContext
- [ ] readOnlyRootFilesystem is enabled with emptyDir for writable paths
- [ ] cosign signing step follows successful build + scan
- [ ] SBOM is generated and uploaded as an artifact
- [ ] No plaintext secrets in any YAML file`,
      claude: `# Claude — Container Security

## Interaction patterns
- When the user asks about "container security" or "image scanning," apply this skill
- Ask about the CI system (GitHub Actions, GitLab CI, Jenkins) before generating pipelines
- Ask whether compliance requirements dictate SBOM format (SPDX vs CycloneDX)

## Response structure
1. **Assessment** — identify current security posture: existing scans, securityContext, secrets handling
2. **Plan** — outline the security improvements with priority ordering
3. **Implementation** — generate CI YAML, Kubernetes manifests, and policy files
4. **Verification** — provide commands to test scanning, signing, and policy enforcement

## Chain-of-thought guidance
- Evaluate the threat model: what are the highest-risk attack surfaces for this container?
- Consider the scanning tool tradeoffs: Trivy (free, fast, broad) vs Snyk (fix advice, base image recs)
- Think about the deployment target: does the cluster have Kyverno or Gatekeeper already?
- Consider secret rotation requirements and external secret operator availability

## Output formatting
- Use yaml language tags for all CI and Kubernetes manifests
- Use tables for vulnerability scanner comparison
- Use a numbered priority list for security improvements
- Reference specific YAML paths when explaining configuration

## Constraints
- Never generate or suggest storing secrets in plaintext
- Always recommend cosign keyless over manual key management when GitHub Actions OIDC is available
- Default to RuntimeDefault seccomp profile unless a custom profile is justified
- Recommend both Trivy and Snyk for defense-in-depth, but note Trivy alone is a valid starting point`,
      agents: `# AGENTS.md — Container Security

## Purpose
Ensure container images and runtime environments meet security best practices for scanning, hardening, signing, and supply chain integrity.

## Review checklist
1. CI pipeline scans every image with Trivy or Snyk before push
2. Build fails on CRITICAL or HIGH severity vulnerabilities
3. Kubernetes Pods have securityContext: runAsNonRoot, drop ALL capabilities, seccompProfile
4. readOnlyRootFilesystem is enabled with emptyDir volumes for writable paths
5. No secrets are baked into image layers
6. Production images are signed with cosign
7. SBOM is generated for every production image
8. Admission controller (Kyverno/Gatekeeper) enforces image signatures in production

## Quality gates
- Trivy scan returns zero CRITICAL vulnerabilities on the final image
- securityContext is present on every container in every Deployment
- cosign verify succeeds for all production image references

## Related skills
- dockerfile-mastery: building secure, minimal images before scanning
- kubernetes-essentials: deploying hardened Pods with probes and resource limits

## Escalation criteria
- Escalate to a human when a CRITICAL CVE has no available fix and the base image cannot be changed
- Escalate when compliance requires custom seccomp profiles or AppArmor integration`
    },
  },
];
