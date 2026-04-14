export default function BatteryVisual({ pct, color, size = "md" }) {
  const dimensions = { sm: [40, 80], md: [52, 104], lg: [64, 128] };
  const [w, h] = dimensions[size] || dimensions.md;
  return (
    <div className={`battery battery--${size}`} style={{ color, width: w, height: h }} role="img" aria-label={`Battery level ${pct}%`}>
      <div className="battery__cap" />
      <div className="battery__fill" style={{ height: `${pct}%`, background: color }} />
      <span className="battery__pct">{pct}%</span>
    </div>
  );
}
