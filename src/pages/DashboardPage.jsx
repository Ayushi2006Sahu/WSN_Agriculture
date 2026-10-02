import { useMemo } from 'react';
import ChartCanvas from '../components/ChartCanvas.jsx';
import { REAL_DATA } from '../logic/realData';

const IRR_COLORS = { HIGH:"#C62828", MEDIUM:"#E65100", LOW:"#2E7D32", MIN:"#0277BD" };
const STATUS_COLORS = { CRITICAL:"#C62828", WARNING:"#E65100", NORMAL:"#2E7D32", PREDICT_LOW:"#0277BD" };

const seasons = [
  { icon:"🌧️", name:"Kharif (Jun–Oct)", tip:"Rainy season. Supplement irrigation only when rain gaps exceed 5 days. Keep soil at 60–80%.", color:"#0277BD", border:"#90CAF9", bg:"#E3F2FD" },
  { icon:"❄️", name:"Rabi (Nov–Mar)",   tip:"Winter season. Irrigate every 7–10 days. Maintain soil moisture at 40–60%.",               color:"#5C6BC0", border:"#9FA8DA", bg:"#E8EAF6" },
  { icon:"☀️", name:"Zaid (Mar–Jun)",   tip:"Summer. Irrigate every 3–5 days. Always water in early morning (5–7 AM) or evening (6–8 PM).", color:"#E65100", border:"#FFCC80", bg:"#FFF3E0" },
];

export default function DashboardPage({ history }) {
  const { DATASET_STATS, CLASSIFICATION_REPORT } = window.SampleData;
  const ML = window.MLPredictor;
    const strategyRows = useMemo(
    () => window.AccuracyEngine
      ? window.AccuracyEngine.compareStrategies(REAL_DATA, ML.MULTI_TASK_PROCESSES)
      : [], []);

  const coojaCounts = { HIGH:0, MEDIUM:0, LOW:0, MIN:0 };
  REAL_DATA.forEach(r => { coojaCounts[r.irr]++; });
  const coojaConfig = {
    type:"doughnut",
    data:{ labels:["HIGH","MEDIUM","LOW","MIN"],
           datasets:[{ data:Object.values(coojaCounts), backgroundColor:Object.values(IRR_COLORS), borderWidth:2 }] },
    options:{ plugins:{ legend:{ position:"right" } }, cutout:"60%" },
  };
  const total   = history.length;
  const avgConf = total > 0 ? +(history.reduce((a,r) => a+r.confidence, 0)/total).toFixed(1) : 0;
 const avgMs   = total > 0 ? +(history.reduce((a,r) => a+(r.taskMode==="single" ? r.singleTimeMs : r.multiTimeMs), 0)/total).toFixed(2) : 0;
  const avgBat  = total > 0 ? +(history.reduce((a,r) => a+r.form.battery,0)/total).toFixed(1) : 0;

  const irrCounts = { HIGH:0, MEDIUM:0, LOW:0, MIN:0 };
  history.forEach(r => { if (r.irrigation) irrCounts[r.irrigation]++; });

  const donutConfig = { type:"doughnut", data:{ labels:["HIGH","MEDIUM","LOW","MIN"], datasets:[{ data:Object.values(irrCounts), backgroundColor:Object.values(IRR_COLORS), borderWidth:2, hoverOffset:6 }] }, options:{ plugins:{ legend:{ position:"right" } }, cutout:"60%" } };

  const trendConfig = history.length > 1 ? {
    type:"line",
    data:{ labels:[...history].reverse().map(r=>r.timestamp), datasets:[
      { label:"Soil Moisture %", data:[...history].reverse().map(r=>r.form.soilMoisture), borderColor:"#2E7D32", tension:.4, fill:false, pointRadius:3 },
      { label:"Battery %",       data:[...history].reverse().map(r=>r.form.battery),      borderColor:"#E65100", tension:.4, fill:false, pointRadius:3 },
    ]},
    options:{ plugins:{ legend:{ position:"top" } }, scales:{ y:{ min:0, max:100 } }, animation:{ duration:400 } },
  } : null;

  const featureImportance = ML.getFeatureImportance();
  const fiColors = { SoilMoisture:"#2E7D32", Stress:"#C62828", Temperature:"#E65100", Battery:"#FF6F00", Humidity:"#0277BD", PredBattery:"#777777" };

  return (
    <main className="page">
      <div className="page__header">
        <div className="page__label">Session Analytics</div>
        <h2 className="page__title">Farm Dashboard</h2>
        <p className="page__sub">RF Model: <strong>{ML.getModelAccuracy()}</strong> accuracy · CV: {DATASET_STATS.cvAccuracy} · Dataset: {DATASET_STATS.totalRows} samples</p>
      </div>

      <div className="grid-4" style={{ marginBottom:22 }}>
        {[
          { val:total,          label:"Total Predictions", sub:"this session",   icon:"🧠", color:"#2E7D32" },
          { val:`${avgConf}%`,  label:"Avg Confidence",    sub:"model certainty",icon:"🎯", color:"#0277BD" },
          { val:`${avgMs}ms`,   label:"Avg Pred Time",     sub:"response speed", icon:"⚡", color:"#E65100" },
          { val:`${avgBat}%`,   label:"Avg Battery",       sub:"across readings",icon:"🔋", color:avgBat>50?"#2E7D32":"#C62828" },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div className="stat-card__icon">{s.icon}</div>
            <div className="stat-card__value" style={{ color:s.color }}>{s.val}</div>
            <div className="stat-card__label">{s.label}</div>
            <div className="stat-card__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        <div className="card">
          <div className="card__label" style={{ marginBottom:10 }}>Irrigation Distribution</div>
          {total > 0 ? <ChartCanvas id="irrDonut" config={donutConfig} height="210px" /> : (
            <div className="empty-state" style={{ padding:40 }}>
              <div className="empty-state__icon">📊</div>
              <p className="empty-state__sub">No predictions yet — make a prediction to see distribution.</p>
            </div>
          )}
        </div>
        <div className="card">
          <div className="card__label" style={{ marginBottom:10 }}>Soil Moisture & Battery Trend</div>
          {trendConfig ? <ChartCanvas id="trendLine" config={trendConfig} height="210px" /> : (
            <div className="empty-state" style={{ padding:40 }}>
              <div className="empty-state__icon">📈</div>
              <p className="empty-state__sub">Make 2 or more predictions to see the trend chart.</p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card__label" style={{ marginBottom:12 }}>Feature Importance — Random Forest Model</div>
        {Object.entries(featureImportance).map(([feat, val]) => (
          <div key={feat} className="prob-row">
            <span className="prob-row__label" style={{ width:120, color:fiColors[feat]||"#888" }}>{feat}</span>
            <div className="prob-row__track">
              <div className="prob-row__fill anim-grow" style={{ width:`${val}%`, background:fiColors[feat]||"#888" }}>{val > 15 ? `${val}%` : ""}</div>
            </div>
            <span className="prob-row__pct">{val}%</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card__label" style={{ marginBottom:12 }}>Classification Report (Test Set)</div>
        <div className="overflow-x">
          <table className="data-table">
            <thead><tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1-Score</th><th>Support</th></tr></thead>
            <tbody>
              {CLASSIFICATION_REPORT.map(r => (
                <tr key={r.cls}>
                  <td><span className={`irr-badge irr-badge--${r.cls}`} style={{ fontSize:".72rem", padding:"2px 10px" }}>{r.cls}</span></td>
                  <td style={{ fontFamily:"var(--font-display)", fontWeight:700 }}>{r.precision.toFixed(2)}</td>
                  <td style={{ fontFamily:"var(--font-display)", fontWeight:700 }}>{r.recall.toFixed(2)}</td>
                  <td style={{ fontFamily:"var(--font-display)", fontWeight:700 }}>{r.f1.toFixed(2)}</td>
                  <td>{r.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid-2" style={{ marginBottom:20 }}>
        <div className="card">
          <div className="card__label" style={{ marginBottom:10 }}>
            🛰️ Cooja (Contiki) Dataset — Irrigation Classes ({REAL_DATA.length} rows)
          </div>
          <ChartCanvas id="coojaDonut" config={coojaConfig} height="210px" />
        </div>
        <div className="card">
          <div className="card__label" style={{ marginBottom:10 }}>Single vs Multi-Task Accuracy on Cooja Data</div>
          <div className="overflow-x">
            <table className="data-table">
              <thead><tr><th>Strategy</th><th>Single</th><th>Multi</th><th>Drop</th></tr></thead>
              <tbody>
                {strategyRows.map(s => (
                  <tr key={s.strategyId}>
                    <td>{s.icon} {s.strategyName}</td>
                    <td>{s.singleAccuracy}%</td>
                    <td>{s.multiAccuracy}%</td>
                    <td style={{ color:"#C62828", fontWeight:700 }}>−{s.accuracyDrop}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize:".65rem", color:"#aaa", marginTop:8 }}>
            Multi-task = simulated process-interference noise model (not measured in Cooja).
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="card__label" style={{ marginBottom:14 }}>📅 Seasonal Irrigation Calendar</div>
        <div className="grid-3">
          {seasons.map((s,i) => (
            <div key={i} className="season-card" style={{ background:s.bg, borderColor:s.border }}>
              <div className="season-card__icon">{s.icon}</div>
              <div className="season-card__name" style={{ color:s.color }}>{s.name}</div>
              <div className="season-card__tip">{s.tip}</div>
            </div>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="card">
          <div className="card__label" style={{ marginBottom:12 }}>Recent Predictions — Session History</div>
          <div className="overflow-x">
            <table className="data-table">
              <thead><tr><th>#</th><th>Time</th><th>Soil</th><th>Temp</th><th>Hum</th><th>Battery</th><th>Irrigation</th><th>Status</th><th>Confidence</th><th>Time (ms)</th></tr></thead>
              <tbody>
                {history.slice(0,15).map((r,i) => (
                  <tr key={i}>
                    <td style={{ color:"#aaa", fontWeight:700 }}>{i+1}</td>
                    <td>{r.timestamp}</td>
                    <td>{r.form.soilMoisture}%</td>
                    <td>{r.form.temperature}°C</td>
                    <td>{r.form.humidity}%</td>
                    <td>{r.form.battery}%</td>
                    <td><span className={`irr-badge irr-badge--${r.irrigation}`} style={{ fontSize:".7rem", padding:"2px 9px" }}>{r.irrigation}</span></td>
                    <td><span style={{ fontWeight:700, color:STATUS_COLORS[r.cropStatus] }}>{r.cropStatus}</span></td>
                    <td>{r.confidence}%</td>
                     <td style={{ fontFamily:"var(--font-display)" }}>{r.taskMode==="single" ? r.singleTimeMs : r.multiTimeMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
