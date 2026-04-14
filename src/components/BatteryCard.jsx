import BatteryVisual from './BatteryVisual.jsx';

const FAULT_COLORS = {
  NORMAL:         { bg: "#E8F5E9", border: "#A5D6A7", text: "#1B5E20" },
  FAULT_RISK:     { bg: "#FFF8E1", border: "#FFD54F", text: "#E65100" },
  FAULT_IMMINENT: { bg: "#FFEBEE", border: "#EF9A9A", text: "#C62828" },
  ABNORMAL_DRAIN: { bg: "#FFF3E0", border: "#FFCC80", text: "#BF6000" },
};
const URGENCY_COLORS  = { LOW: "#2E7D32", MEDIUM: "#E65100", HIGH: "#C62828", CRITICAL: "#880000" };
const ADAPTIVE_COLORS = { NORMAL: "#2E7D32", MEDIUM: "#0277BD", LOW_BATTERY: "#E65100", CRITICAL: "#C62828" };

export default function BatteryCard({ label, pct, result, isNext = false, onSpeak, compact = false }) {
  if (!result) return null;
  const { adaptive, smart, fault, irrLink } = result;
  const faultStyle  = FAULT_COLORS[fault?.faultLevel] || FAULT_COLORS.NORMAL;
  const adaptColor  = ADAPTIVE_COLORS[adaptive?.mode] || "#555";
  const urgentColor = URGENCY_COLORS[smart?.urgency]  || "#555";

  return (
    <div className="card" style={{ height: "100%" }}>
      <div className="card__label">{label}</div>
      <div className="battery-card-inner">
        <BatteryVisual pct={pct} color={result.barColor} size="md" />
        <div className="battery-info">
          <div className="battery-info__time" style={{ color: result.barColor }}>{result.hoursInt}h {result.minutesRemainder}m</div>
          <div className="battery-info__days">= {result.daysRemaining} days</div>
          <div className="battery-info__status" style={{ marginTop: 7 }}>
            <span className="badge" style={{ background: result.barColor + "22", color: result.barColor, fontSize: ".78rem", padding: "3px 12px" }}>
              {result.status === "CRITICAL" ? "🔴" : result.status === "LOW" ? "🟠" : result.status === "MEDIUM" ? "🟡" : "🟢"} {result.status}
            </span>
          </div>
          <div className="battery-info__replace">{result.replacementDate}</div>
          <div className="battery-info__drain">Drain: {result.drainPerCycle}%/cycle · {result.readingsLeft} readings left</div>
          <div style={{ fontSize: ".72rem", color: "#aaa", marginTop: 2 }}>Lifetime from 100%: ~{result.lifetimeDaysFrom100} days</div>
          {isNext && <div className="battery-info__note" style={{ color: result.barColor }}>After next reading cycle</div>}
        </div>
      </div>
      <div className="battery-alert">{result.alertMessage}</div>
      {onSpeak && <button className="btn btn--voice btn--sm" onClick={onSpeak} style={{ marginTop: 10 }}>🔊 Speak Battery Status</button>}
      {!compact && adaptive && (
        <>
          <div style={{ marginTop: 14, borderRadius: 10, padding: "11px 14px", background: adaptColor + "11", border: `1.5px solid ${adaptColor}44` }}>
            <div style={{ fontWeight: 800, fontSize: ".78rem", color: adaptColor, marginBottom: 4 }}>⚙️ Adaptive Interval</div>
            <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#333" }}>
              Mode: <span style={{ color: adaptColor }}>{adaptive.mode}</span> · Read every <strong>{adaptive.intervalMinutes} min</strong>
              {adaptive.savingVsDefault > 0 && <span style={{ color: "#2E7D32", marginLeft: 6 }}>(saves {adaptive.savingVsDefault}% battery)</span>}
            </div>
            <div style={{ fontSize: ".75rem", color: "#666", marginTop: 3 }}>{adaptive.reason}</div>
          </div>
          <div style={{ marginTop: 10, borderRadius: 10, padding: "11px 14px", background: urgentColor + "0D", border: `1.5px solid ${urgentColor}33` }}>
            <div style={{ fontWeight: 800, fontSize: ".78rem", color: urgentColor, marginBottom: 4 }}>🧠 Smart Logic</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: ".8rem" }}>
              <span>Priority: <strong style={{ color: urgentColor }}>{smart.priority}</strong></span>
              <span>Urgency: <strong style={{ color: urgentColor }}>{smart.urgency}</strong></span>
              <span>Freq: <strong>{smart.freqLabel}</strong></span>
            </div>
            {smart.reasons.map((r, i) => <div key={i} style={{ fontSize: ".72rem", color: "#666", marginTop: 3 }}>· {r}</div>)}
          </div>
          <div style={{ marginTop: 10, borderRadius: 10, padding: "11px 14px", background: faultStyle.bg, border: `1.5px solid ${faultStyle.border}` }}>
            <div style={{ fontWeight: 800, fontSize: ".78rem", color: faultStyle.text, marginBottom: 4 }}>🛡️ Fault Prevention: {fault.faultLevel}</div>
            <div style={{ fontSize: ".78rem", color: "#555", marginTop: 3 }}>{fault.faultMessage}</div>
            <div style={{ fontSize: ".72rem", color: "#777", marginTop: 3, fontStyle: "italic" }}>Action: {fault.faultAction}</div>
          </div>
          {irrLink && (
            <div style={{ marginTop: 10, borderRadius: 10, padding: "11px 14px", background: "#F3E5F5", border: "1.5px solid #CE93D8" }}>
              <div style={{ fontWeight: 800, fontSize: ".78rem", color: "#6A1B9A", marginBottom: 4 }}>🔗 Irrigation → Battery Link</div>
              <div style={{ fontSize: ".78rem", color: "#555" }}>{irrLink.impact}</div>
              <div style={{ fontSize: ".75rem", color: "#777", marginTop: 4, fontWeight: 600 }}>{irrLink.recommendation}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
