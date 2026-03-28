export default function Loading() {
  return (
    <main className="page-shell">
      <section className="hero-grid">
        <div className="skeleton skeleton--tall" />
        <div className="skeleton skeleton--panel" />
      </section>
      <section className="grid-three">
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--card" />
      </section>
    </main>
  );
}
