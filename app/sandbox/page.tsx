import { SandboxShell } from "@/components/sandbox-shell";
import { SiteHeader } from "@/components/site-header";
import { UsageBeacon } from "@/components/usage-beacon";
import { AGENT_PROVIDER_PRESETS } from "@/lib/agents";
import { getSkillwireSnapshot } from "@/lib/refresh";

type SandboxPageProps = {
  searchParams: Promise<{ skill?: string }>;
};

export const dynamic = "force-dynamic";

export default async function SandboxPage({ searchParams }: SandboxPageProps) {
  const [{ snapshot }, params] = await Promise.all([
    import("@/lib/system-summary").then((m) => m.getSystemSnapshot()),
    searchParams
  ]);

  return (
    <>
      <UsageBeacon
        dedupeKey="page:/sandbox"
        kind="page_view"
        label="Opened sandbox"
        path="/sandbox"
      />
      <SiteHeader />
      <SandboxShell
        initialSkillSlug={params.skill}
        presets={AGENT_PROVIDER_PRESETS}
        skills={snapshot.skills}
      />
    </>
  );
}
