const PROB_COLORS = { HIGH: "#C62828", MEDIUM: "#E65100", LOW: "#2E7D32", MIN: "#0277BD" };
export default function ProbabilityBars({ probabilities }) {
  if (!probabilities) return null;
  return (
    <div role="list">
      {Object.entries(probabilities).map(([cls, pct]) => (
        <div key={cls} className="prob-row" role="listitem">
          <span className="prob-row__label" style={{ color: PROB_COLORS[cls] || "#888" }}>{cls}</span>
          <div className="prob-row__track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="prob-row__fill anim-grow" style={{ width: `${pct}%`, background: PROB_COLORS[cls] || "#888" }}>
              {pct > 18 ? `${pct}%` : ""}
            </div>
          </div>
          <span className="prob-row__pct">{pct}%</span>
        </div>
      ))}
    </div>
  );
}
