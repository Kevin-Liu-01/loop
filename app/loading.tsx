import { PageShell } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell className="grid gap-6">
      <section className="grid grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] gap-5 max-lg:grid-cols-1">
        <div className="skeleton skeleton--tall" />
        <div className="skeleton skeleton--panel" />
      </section>
      <section className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--card" />
      </section>
    </PageShell>
  );
}
