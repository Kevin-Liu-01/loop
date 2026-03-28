import Link from "next/link";

import { ImportSkillForm } from "@/components/import-skill-form";
import { SiteHeader } from "@/components/site-header";
import { UsageBeacon } from "@/components/usage-beacon";
import { UserSkillForm } from "@/components/user-skill-form";
import { getSkillwireSnapshot } from "@/lib/refresh";

export default async function NewSkillPage() {
  const snapshot = await getSkillwireSnapshot();

  return (
    <>
      <UsageBeacon dedupeKey="page:/skills/new" kind="page_view" label="Opened add skill" path="/skills/new" />
      <SiteHeader
        sections={[
          { href: "/", label: "Desk" },
          { href: "/admin", label: "Ops" },
          { href: "/skills/new", label: "Add" },
          { href: "/agents", label: "Agents" }
        ]}
      />
      <main className="page-shell page-shell--narrow">
        <section className="workspace-hero">
          <div className="workspace-hero__copy">
            <span className="section-kicker">Add</span>
            <h1>Import it. Or write it.</h1>
            <p className="lede">Then edit sources and refresh.</p>
          </div>
          <div className="workspace-actions">
            <Link className="button button--ghost" href="/#catalog">
              Browse catalog
            </Link>
            <Link className="button button--ghost" href="/admin#updates">
              Open updates
            </Link>
          </div>
        </section>

        <section className="journey-strip journey-strip--dense" aria-label="Add flow">
          <article className="journey-step">
            <div>
              <strong>1</strong>
              <p>Import or create.</p>
            </div>
          </article>
          <article className="journey-step">
            <div>
              <strong>2</strong>
              <p>Add sources and rules.</p>
            </div>
          </article>
          <article className="journey-step">
            <div>
              <strong>3</strong>
              <p>Save, then refresh.</p>
            </div>
          </article>
        </section>

        <section className="create-entry-grid">
          <ImportSkillForm />
          <UserSkillForm categories={snapshot.categories} />
        </section>
      </main>
    </>
  );
}
