type SystemStatusItem = {
  label: string;
  state: string;
  detail: string;
  tone: "ok" | "warn" | "info";
};

type SystemStatusProps = {
  items: SystemStatusItem[];
};

export function SystemStatus({ items }: SystemStatusProps) {
  return (
    <section className="card system-status">
      <div className="section-head">
        <div>
          <span className="eyebrow">Reality check</span>
          <h2>What actually works</h2>
        </div>
        <small>Honest, not decorative</small>
      </div>

      <div className="status-board">
        {items.map((item) => (
          <article className="status-row" key={item.label}>
            <span className={`status-dot status-dot--${item.tone}`} aria-hidden="true" />
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
            <span className="status-state">{item.state}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
