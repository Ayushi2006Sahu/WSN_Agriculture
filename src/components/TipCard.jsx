export default function TipCard({ tips, onSpeak }) {
  if (!tips || tips.length === 0) return null;
  return (
    <div className="tip-card">
      <div className="tip-card__head">🌾 Best Practices for Your Farm
        <span style={{ fontSize: ".75rem", fontWeight: 400, color: "#888", marginLeft: 8 }}>· Click any tip to hear it</span>
      </div>
      {tips.map((tip, i) => (
        <div key={i} className="tip-row card--interactive" style={{ cursor: onSpeak ? "pointer" : "default" }}
          onClick={() => onSpeak && onSpeak(tip.voiceEn, tip.voiceHi)}
          role={onSpeak ? "button" : undefined} tabIndex={onSpeak ? 0 : undefined}
          onKeyDown={(e) => e.key === "Enter" && onSpeak && onSpeak(tip.voiceEn, tip.voiceHi)}>
          <div className="tip-row__icon" style={{ background: tip.bgColor }} aria-hidden="true">{tip.icon}</div>
          <div style={{ flex: 1 }}>
            <div className="tip-row__title">{tip.title}</div>
            <div className="tip-row__body">{tip.body}</div>
            {onSpeak && <div className="tip-row__hint">🔊 Click to hear in English + Hindi</div>}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 14, background: "linear-gradient(90deg, #E8F5E9, #FFF8E1, #E1F5FE)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 16, flexWrap: "wrap", fontSize: ".78rem", fontWeight: 600, color: "#555" }}>
        <span>💡 {tips.length} personalized tips generated</span>
        <span>🔊 Voice: English + Hindi bilingual</span>
        <span>📡 Based on live sensor data</span>
      </div>
    </div>
  );
}
