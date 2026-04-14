import { useState, useCallback, useMemo } from 'react';
import BatteryCard from '../components/BatteryCard.jsx';
import ProbabilityBars from '../components/ProbabilityBars.jsx';
import TipCard from '../components/TipCard.jsx';
import BatteryVisual from '../components/BatteryVisual.jsx';

function stressLabel(val) {
  if (val < 80)  return { label:"HEALTHY",  color:"#2E7D32", bg:"#E8F5E9" };
  if (val < 120) return { label:"MILD",     color:"#558B2F", bg:"#F1F8E9" };
  if (val < 170) return { label:"MODERATE", color:"#E65100", bg:"#FFF3E0" };
  if (val < 210) return { label:"CRITICAL", color:"#C62828", bg:"#FFEBEE" };
  return             { label:"SEVERE",   color:"#880000", bg:"#FFCDD2" };
}

const SLIDER_FIELDS = [
  { key:"soilMoisture", label:"Soil Moisture", icon:"💧", unit:"%",  min:0,  max:100, color:"#2E7D32", hint:"Dry soil → stress ↑ → drain ↑" },
  { key:"temperature",  label:"Temperature",   icon:"🌡️", unit:"°C", min:15, max:45,  color:"#C62828", hint:"Higher temp → stress ↑ → drain ↑" },
  { key:"humidity",     label:"Humidity",      icon:"☁️", unit:"%",  min:0,  max:100, color:"#0277BD", hint:"Lower humidity → stress ↑ → drain ↑" },
  { key:"battery",      label:"Battery",       icon:"🔋", unit:"%",  min:0,  max:100, color:"#E65100", hint:"< 20% triggers MIN irrigation mode" },
];

const PROC_CATS = { sensing:"#2E7D32", actuation:"#C62828", comms:"#0277BD", monitoring:"#E65100", compute:"#6A1B9A" };

function TaskComparePanel({ result, CATALOG, SINGLE_PROCS, MULTI_PROCS }) {
  const singleDrain = result.singleDrain;
  const multiDrain  = result.multiDrain;
  const drainDiff   = parseFloat((multiDrain - singleDrain).toFixed(3));
  const timeDiff    = parseFloat((result.multiTimeMs - result.singleTimeMs).toFixed(3));
  const COLS = [
    { mode:"single", label:"Single Task", icon:"🔵", color:"#1565C0", bg:"#E3F2FD", procs:SINGLE_PROCS, drain:singleDrain, accuracy:result.singleAccuracy, timeMs:result.singleTimeMs },
    { mode:"multi",  label:"Multi Task",  icon:"🟢", color:"#1B5E20", bg:"#E8F5E9", procs:MULTI_PROCS,  drain:multiDrain,  accuracy:result.multiAccuracy,  timeMs:result.multiTimeMs  },
  ];
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ background:"linear-gradient(135deg,#1A2E1C,#2E5030)", borderRadius:"14px 14px 0 0", padding:"12px 16px", color:"white", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:".88rem", fontFamily:"var(--font-display)" }}>⚙️ Single vs Multi-Task — This Prediction</div>
          <div style={{ fontSize:".67rem", color:"rgba(255,255,255,.45)", marginTop:2 }}>Soil {result.form.soilMoisture}% · Temp {result.form.temperature}°C · Hum {result.form.humidity}% · Battery {result.form.battery}% · {result.irrigation} mode</div>
        </div>
        <span style={{ background:"rgba(102,187,106,.2)", border:"1px solid rgba(102,187,106,.35)", color:"#A5D6A7", fontWeight:800, fontSize:".68rem", padding:"2px 10px", borderRadius:20 }}>
          {result.taskMode==="single"?"🔵 SINGLE ACTIVE":"🟢 MULTI ACTIVE"}
        </span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", border:"1.5px solid #E0DDD7", borderTop:"none", borderRadius:"0 0 14px 14px", overflow:"hidden" }}>
        {COLS.map((col,ci) => {
          const isActive = result.taskMode === col.mode;
          return (
            <div key={col.mode} style={{ background:isActive?col.bg:"white", borderRight:ci===0?"1.5px solid #E0DDD7":"none", padding:"14px 13px", position:"relative" }}>
              {isActive && <div style={{ position:"absolute", top:8, right:8, background:col.color, color:"white", fontWeight:800, fontSize:".58rem", padding:"1px 7px", borderRadius:9 }}>ACTIVE</div>}
              <div style={{ fontWeight:800, fontSize:".82rem", color:col.color, marginBottom:10, fontFamily:"var(--font-display)" }}>{col.icon} {col.label}</div>
              <div style={{ marginBottom:8, padding:"9px 11px", background:col.color+"12", borderRadius:9, border:`1px solid ${col.color}25` }}>
                <div style={{ fontSize:".6rem", color:"#888", marginBottom:1 }}>RF Accuracy</div>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.55rem", color:col.color, lineHeight:1 }}>{col.accuracy}%</div>
                {col.mode==="multi" && <div style={{ fontSize:".6rem", color:"#C62828", marginTop:2, fontWeight:700 }}>−1.5% from process interference noise</div>}
              </div>
              <div style={{ marginBottom:8, padding:"9px 11px", background:"#F5F5F5", borderRadius:9, border:"1px solid #E0DDD7" }}>
                <div style={{ fontSize:".6rem", color:"#888", marginBottom:1 }}>Prediction time</div>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.3rem", color:"#333", lineHeight:1 }}>{col.timeMs} ms</div>
                {col.mode==="multi" && timeDiff !== 0 && <div style={{ fontSize:".6rem", color:"#888", marginTop:2 }}>{timeDiff>0?`+${timeDiff}`:timeDiff} ms vs single</div>}
              </div>
              <div style={{ marginBottom:10, padding:"9px 11px", background:col.color+"08", borderRadius:9, border:`1px solid ${col.color}25` }}>
                <div style={{ fontSize:".6rem", color:"#888", marginBottom:1 }}>Battery drain / cycle</div>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.35rem", color:col.color, lineHeight:1 }}>{col.drain}%</div>
                {col.mode==="multi" && drainDiff>0 && <div style={{ fontSize:".6rem", color:"#C62828", marginTop:2, fontWeight:700 }}>+{drainDiff}% extra overhead</div>}
                <div style={{ background:"#E0E0E0", borderRadius:3, height:5, marginTop:6, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.min(100,(col.drain/12)*100)}%`, background:col.color, borderRadius:3, transition:"width .4s" }} />
                </div>
              </div>
              <div style={{ fontSize:".62rem", color:"#888", fontWeight:700, marginBottom:5 }}>{col.procs.length} process{col.procs.length>1?"es":""} running:</div>
              <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                {MULTI_PROCS.map(pid => {
                  const proc = CATALOG[pid] || {};
                  const on   = col.procs.includes(pid);
                  const cc   = PROC_CATS[proc.category] || "#888";
                  return (
                    <div key={pid} style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 7px", background:on?cc+"12":"#F8F8F8", border:on?`1px solid ${cc}30`:"1px solid transparent", borderRadius:6, opacity:on?1:0.38 }}>
                      <span style={{ fontSize:".78rem" }}>{proc.icon||"⚙️"}</span>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:on?"#66BB6A":"#CCC", display:"inline-block", flexShrink:0, boxShadow:on?"0 0 4px #66BB6A":"none" }} />
                      <span style={{ fontSize:".62rem", fontWeight:700, color:on?"#333":"#bbb", flex:1, lineHeight:1.2 }}>{proc.name||pid}</span>
                      <span style={{ fontSize:".58rem", color:on?cc:"#ccc", fontWeight:700 }}>{on?`${proc.baseDrain}%`:"—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:10, padding:"11px 14px", background:"linear-gradient(135deg,#FFF8E1,#FFF3E0)", border:"1.5px solid #FFD54F44", borderRadius:11 }}>
        <div style={{ fontWeight:800, fontSize:".72rem", color:"#BF6000", marginBottom:7 }}>🔋 Drain per cycle — {result.form.battery}% battery · {result.irrigation} mode</div>
        {[{ label:"Single", val:singleDrain, color:"#1565C0" }, { label:"Multi", val:multiDrain, color:"#1B5E20" }].map((row,i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:i===0?5:0 }}>
            <span style={{ fontSize:".67rem", color:"#555", width:46, flexShrink:0 }}>{row.label}</span>
            <div style={{ flex:1, background:"#E0E0E0", borderRadius:4, height:9, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min(100,(row.val/12)*100)}%`, background:row.color, borderRadius:4, transition:"width .5s" }} />
            </div>
            <span style={{ fontSize:".72rem", fontWeight:800, color:row.color, width:42, textAlign:"right" }}>{row.val}%</span>
          </div>
        ))}
        {drainDiff > 0 && <div style={{ fontSize:".67rem", color:"#C62828", fontWeight:700, marginTop:6 }}>Multi-task uses +{drainDiff}% extra battery — radio_tx + battery_chk + ml_predict overhead.</div>}
      </div>
    </div>
  );
}

export default function PredictPage({ history, setHistory }) {
  const [taskMode, setTaskMode]               = useState("single");
  const [irrigationActive, setIrrigationActive] = useState(false);
  const [formValues, setFormValues]           = useState({ soilMoisture:50, temperature:28, humidity:60, battery:80 });
  const [result, setResult]                   = useState(null);
  const [loading, setLoading]                 = useState(false);

  const ML = window.MLPredictor || {};
  const BP = window.BatteryPredictor || {};

  const liveBreak = ML.getStressBreakdown
    ? ML.getStressBreakdown(formValues.soilMoisture, formValues.temperature, formValues.humidity)
    : { total:0, level:"HEALTHY", levelColor:"#2E7D32", soilContribution:0,tempContribution:0,humContribution:0,soilPercent:0,tempPercent:0,humPercent:0 };

  const livePredBat = ML.getLivePredBattery
    ? ML.getLivePredBattery(formValues.battery, formValues.soilMoisture, formValues.temperature, formValues.humidity)
    : { predBattery:Math.max(0,formValues.battery-5), drainPerCycle:4.715, irrigation:"MEDIUM", stress:0 };

  const CATALOG      = ML.PROCESS_CATALOG || {};
  const SINGLE_PROCS = ML.SINGLE_TASK_PROCESSES || ["soil_read","temp_read","hum_read"];
  const MULTI_PROCS  = ML.MULTI_TASK_PROCESSES  || Object.keys(CATALOG);

  const sl = stressLabel(liveBreak.total);

  const handleChange = useCallback((field, val) => {
    setFormValues(prev => ({ ...prev, [field]: val }));
  }, []);

  function runMode(mode) {
    if (!ML.predict) return null;
    const t0 = performance.now();
    const p  = ML.predict(formValues.soilMoisture, formValues.temperature, formValues.humidity, formValues.battery, formValues.battery - 5, { mode, irrigationActive });
    return { p, ms: parseFloat((performance.now() - t0).toFixed(3)) };
  }

  function drainForMode(mode, stress, irrigation) {
    if (!ML.computeDrainPerCycle) return 4.715;
    const base = ML.computeDrainPerCycle(irrigation, stress, formValues.temperature, formValues.soilMoisture);
    if (mode === "single") return parseFloat(base.toFixed(3));
    const extra = (CATALOG.radio_tx?.baseDrain||0.90) + (CATALOG.battery_chk?.baseDrain||0.10) + (CATALOG.ml_predict?.baseDrain||0.40);
    return parseFloat((base + extra).toFixed(3));
  }

  const handlePredict = useCallback(() => {
    if (!ML.predict) return;
    setLoading(true);
    setTimeout(() => {
      const sRes = runMode("single");
      const mRes = runMode("multi");
      if (!sRes || !mRes) { setLoading(false); return; }
      const active = taskMode === "single" ? sRes : mRes;
      const pred   = active.p;
      const singleDrain    = drainForMode("single", pred.calculatedStress, pred.irrigation);
      const multiDrain     = drainForMode("multi",  pred.calculatedStress, pred.irrigation);
      const batResult = BP.estimateBatteryLife ? BP.estimateBatteryLife(formValues.battery, pred.computedPredBattery, pred.irrigation, 10, formValues.soilMoisture, pred.calculatedStress) : null;
      const tips = window.TipsEngine?.generateTips ? window.TipsEngine.generateTips(pred, { soilMoisture:formValues.soilMoisture, temperature:formValues.temperature, humidity:formValues.humidity, battery:formValues.battery, predBattery:pred.computedPredBattery, stress:pred.calculatedStress }) : [];
      const fullResult = { ...pred, batResult, tips, taskMode, activeProcs:taskMode==="single"?SINGLE_PROCS:MULTI_PROCS, singleAccuracy:98.33, multiAccuracy:parseFloat((98.33-1.5).toFixed(2)), singleTimeMs:sRes.ms, multiTimeMs:mRes.ms, singleDrain, multiDrain, timestamp:new Date().toLocaleTimeString("en-IN"), form:{ ...formValues, computedPredBattery:pred.computedPredBattery, stress:pred.calculatedStress } };
      setResult(fullResult);
      setHistory(prev => [fullResult, ...prev.slice(0,49)]);
      setLoading(false);
      window.VoiceAssistant?.speakPredictionResult?.(pred, batResult);
    }, 280 + Math.random()*140);
  }, [formValues, taskMode, irrigationActive]);

  const batWarn = formValues.battery < 20
    ? { msg:"Critical — MIN mode will trigger!", color:"#C62828" }
    : formValues.battery < 40
    ? { msg:"Low — plan replacement soon.", color:"#E65100" }
    : null;

  return (
    <main className="page">
      <div className="page__header">
        <div className="page__label">AI Irrigation System — v6</div>
        <h2 className="page__title">Irrigation Prediction</h2>
        <p className="page__sub">Sliders update stress &amp; pred-battery live · Predict to see single vs multi-task comparison</p>
      </div>

      {/* Sensor strip */}
      <div className="sensor-strip" style={{ marginBottom:16 }}>
        {[
          { label:"💧 Soil",    val:formValues.soilMoisture, unit:"%",  color:"#2E7D32" },
          { label:"🌡️ Temp",   val:formValues.temperature,  unit:"°C", color:"#C62828" },
          { label:"☁️ Hum",    val:formValues.humidity,     unit:"%",  color:"#0277BD" },
          { label:"🔋 Battery", val:formValues.battery,      unit:"%",  color:"#E65100" },
          { label:"🌿 Stress",  val:liveBreak.total,         unit:"",   color:liveBreak.levelColor },
          { label:"⚡ PredBat", val:livePredBat.predBattery, unit:"%",  color:"#8E24AA" },
          ...(result?[{ label:"🎯 Confidence", val:result.confidence, unit:"%", color:"#2E7D32" }]:[]),
        ].map((item,i) => (
          <div key={i} className="sensor-strip__item">
            <div className="sensor-strip__val" style={{ color:item.color }}>{item.val}{item.unit}</div>
            <div className="sensor-strip__lbl">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Task mode */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontWeight:700, fontSize:".8rem", color:"#555" }}>⚙️ Task Mode:</span>
        {[{ id:"single", icon:"🔵", label:"Single Task", sub:"3 procs · 98.33% · lower drain" }, { id:"multi", icon:"🟢", label:"Multi Task", sub:"7 procs · 96.83% · higher drain" }].map(m => (
          <button key={m.id} onClick={() => setTaskMode(m.id)} style={{ background:taskMode===m.id?(m.id==="single"?"#E3F2FD":"#E8F5E9"):"white", border:`2px solid ${taskMode===m.id?(m.id==="single"?"#1565C0":"#1B5E20"):"#E0DDD7"}`, borderRadius:11, padding:"7px 15px", cursor:"pointer", textAlign:"left", transition:"all .2s" }}>
            <div style={{ fontWeight:800, fontSize:".8rem", color:taskMode===m.id?(m.id==="single"?"#1565C0":"#1B5E20"):"#666" }}>{m.icon} {m.label}</div>
            <div style={{ fontSize:".6rem", color:"#aaa" }}>{m.sub}</div>
          </button>
        ))}
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:".78rem", color:"#666", cursor:"pointer" }}>
          <input type="checkbox" checked={irrigationActive} onChange={e => setIrrigationActive(e.target.checked)} style={{ accentColor:"#2E7D32", width:14, height:14 }} />
          🚰 Pump active
        </label>
      </div>

      {/* Main layout */}
      <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
        {/* Sidebar */}
        <aside style={{ width:294, flexShrink:0, position:"sticky", top:130, alignSelf:"flex-start" }}>
          <div className="card" style={{ padding:"16px 14px" }}>
            <div className="card__label" style={{ marginBottom:10 }}>📡 Sensor Inputs</div>
            {SLIDER_FIELDS.map(f => {
              const pct = ((formValues[f.key] - f.min) / (f.max - f.min)) * 100;
              return (
                <div key={f.key} style={{ marginBottom:13 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3 }}>
                    <span style={{ fontSize:".77rem", fontWeight:700, color:"#444" }}>{f.icon} {f.label}</span>
                    <span style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1rem", color:f.color }}>{formValues[f.key]}{f.unit}</span>
                  </div>
                  <input type="range" min={f.min} max={f.max} value={formValues[f.key]}
                    onChange={e => handleChange(f.key, parseInt(e.target.value))}
                    style={{ width:"100%", background:`linear-gradient(to right,${f.color} ${pct}%,#DDD ${pct}%)` }} />
                  <div style={{ fontSize:".62rem", color:"#bbb", marginTop:1 }}>{f.hint}</div>
                </div>
              );
            })}
            {batWarn && <div style={{ background:batWarn.color+"15", border:`1.5px solid ${batWarn.color}44`, borderRadius:8, padding:"6px 10px", fontSize:".7rem", color:batWarn.color, fontWeight:700, marginBottom:8 }}>⚠️ {batWarn.msg}</div>}

            {/* Live Stress */}
            <div style={{ background:sl.bg, border:`1.5px solid ${sl.color}44`, borderRadius:11, padding:"11px 12px", marginBottom:9 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <span style={{ fontWeight:800, fontSize:".73rem", color:"#555" }}>🌿 Stress Index</span>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.4rem", color:sl.color, lineHeight:1 }}>{liveBreak.total}<span style={{ fontSize:".6rem", color:"#aaa", marginLeft:2 }}>/250</span></div>
              </div>
              <span style={{ background:sl.color, color:"white", fontWeight:800, fontSize:".6rem", padding:"1px 8px", borderRadius:20 }}>{sl.label}</span>
              <div style={{ background:"#DDD", borderRadius:5, height:5, margin:"7px 0", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min(100,(liveBreak.total/250)*100)}%`, background:sl.color, borderRadius:5, transition:"width .35s" }} />
              </div>
              {[{ label:"💧 Soil", val:liveBreak.soilContribution, pct:liveBreak.soilPercent, color:"#2E7D32" }, { label:"🌡️ Temp", val:liveBreak.tempContribution, pct:liveBreak.tempPercent, color:"#C62828" }, { label:"☁️ Hum", val:liveBreak.humContribution, pct:liveBreak.humPercent, color:"#0277BD" }].map((b,i) => (
                <div key={i} style={{ marginBottom:3 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:".62rem", marginBottom:1 }}>
                    <span style={{ color:"#777" }}>{b.label}</span>
                    <span style={{ color:b.color, fontWeight:700 }}>+{b.val} ({b.pct}%)</span>
                  </div>
                  <div style={{ background:"#EEE", borderRadius:3, height:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${b.pct}%`, background:b.color, borderRadius:3, transition:"width .3s" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Live Pred Battery */}
            <div style={{ background:"#F3E5F5", border:"1.5px solid #CE93D8", borderRadius:11, padding:"11px 12px", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontWeight:800, fontSize:".73rem", color:"#6A1B9A" }}>⚡ Pred Battery</span>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.4rem", color:livePredBat.predBattery<20?"#C62828":livePredBat.predBattery<40?"#E65100":"#6A1B9A", lineHeight:1 }}>{livePredBat.predBattery}%</div>
              </div>
              <div style={{ fontSize:".63rem", color:"#888", marginBottom:4 }}>Drain: <strong style={{ color:"#6A1B9A" }}>{livePredBat.drainPerCycle}%</strong> · {formValues.battery}% → {livePredBat.predBattery}%</div>
              <div style={{ background:"#E1BEE7", borderRadius:4, height:5, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min(100,(livePredBat.drainPerCycle/10)*100)}%`, background:"#8E24AA", borderRadius:4, transition:"width .35s" }} />
              </div>
            </div>

            <button className="btn btn--primary btn--full" onClick={handlePredict} disabled={loading}>
              {loading ? <><div className="spinner"/><span>Predicting…</span></> : <><span>{taskMode==="single"?"🔵":"🟢"}</span><span>Run {taskMode==="single"?"Single":"Multi"} Prediction</span></>}
            </button>
            <p style={{ textAlign:"center", fontSize:".6rem", color:"#ccc", marginTop:4 }}>RF 98.33% accuracy · both modes timed &amp; compared</p>
          </div>
        </aside>

        {/* Results panel */}
        <div style={{ flex:1, minWidth:0 }}>
          {result ? (
            <div className="anim-fade">
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
                <div className="timing-badge">⏱ {result.taskMode==="single"?result.singleTimeMs:result.multiTimeMs} ms</div>
                <span style={{ background:result.taskMode==="single"?"#1565C015":"#1B5E2015", border:`1.5px solid ${result.taskMode==="single"?"#1565C044":"#1B5E2044"}`, color:result.taskMode==="single"?"#1565C0":"#1B5E20", fontWeight:800, fontSize:".7rem", padding:"3px 10px", borderRadius:20 }}>
                  {result.taskMode==="single"?"🔵 SINGLE":"🟢 MULTI"} · {result.activeProcs.length} procs
                </span>
                <button className="btn btn--voice" onClick={() => window.VoiceAssistant?.speakPredictionResult?.(result, result.batResult)}>🔊 Speak</button>
                <span style={{ fontSize:".72rem", color:"#bbb" }}>· {result.timestamp}</span>
              </div>

              <div className={`village-alert village-alert--${result.irrigation}`} style={{ marginBottom:14 }}>
                <span className="village-alert__icon">{result.irrigation==="HIGH"?"🚨":result.irrigation==="MEDIUM"?"⚠️":result.irrigation==="LOW"?"✅":"🔋"}</span>
                <div style={{ flex:1 }}>
                  <div className="village-alert__title">{result.adviceEn}</div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:5 }}>
                    <span className="village-alert__meta">🎯 {result.confidence}%</span>
                    <span className="village-alert__meta">Status: <strong className={`status--${result.cropStatus}`}>{result.cropStatus}</strong></span>
                    <span className="village-alert__meta">🌿 Stress: <strong style={{ color:result.stressBreakdown?.levelColor }}>{result.calculatedStress} ({result.stressBreakdown?.level})</strong></span>
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom:14 }}>
                <div className="card card--sm" style={{ textAlign:"center" }}>
                  <div className="card__label" style={{ marginBottom:6 }}>Irrigation Level</div>
                  <span className={`irr-badge irr-badge--${result.irrigation}`}>{result.irrigation}</span>
                  <div style={{ fontSize:".73rem", color:"#888", marginTop:7 }}>{{HIGH:"High water supply",MEDIUM:"Moderate watering",LOW:"Low watering OK",MIN:"Replace battery first"}[result.irrigation]}</div>
                </div>
                <div className="card card--sm" style={{ textAlign:"center" }}>
                  <div className="card__label" style={{ marginBottom:6 }}>Crop Status</div>
                  <div className={`status--${result.cropStatus}`} style={{ fontFamily:"var(--font-display)", fontSize:"1.4rem", fontWeight:800 }}>{result.cropStatus}</div>
                  <div style={{ fontSize:".72rem", color:"#888", marginTop:7 }}>Stress: <strong style={{ color:result.stressBreakdown?.levelColor }}>{result.calculatedStress}</strong></div>
                </div>
              </div>

              <TaskComparePanel result={result} CATALOG={CATALOG} SINGLE_PROCS={SINGLE_PROCS} MULTI_PROCS={MULTI_PROCS} />

              {/* Predicted Battery */}
              <div className="card" style={{ marginBottom:14, background:"#F3E5F5", border:"2px solid #CE93D8" }}>
                <div className="card__label" style={{ marginBottom:9, color:"#6A1B9A" }}>⚡ Predicted Battery</div>
                <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
                  {[{ label:"Current", val:`${result.form.battery}%`, color:"#E65100" }, { label:"→", val:"", color:"" }, { label:"After cycle", val:`${result.computedPredBattery}%`, color:"#8E24AA" }, { label:"Drained", val:`−${result.drainPerCycle}%`, color:"#C62828" }, ...(result.pumpDrainExtra>0?[{label:"Pump extra",val:`+${result.pumpDrainExtra}%`,color:"#C62828"}]:[])].map((d,i) =>
                    d.val===""
                      ? <div key={i} style={{ fontSize:"1.3rem", color:"#aaa" }}>→</div>
                      : <div key={i} style={{ textAlign:"center" }}><div style={{ fontSize:".65rem", color:"#888" }}>{d.label}</div><div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.7rem", color:d.color, lineHeight:1 }}>{d.val}</div></div>
                  )}
                </div>
                <div style={{ background:"#E1BEE7", borderRadius:6, height:8, overflow:"hidden", marginBottom:8 }}>
                  <div style={{ height:"100%", width:`${Math.min(100,(result.drainPerCycle/12)*100)}%`, background:"#8E24AA", borderRadius:6 }} />
                </div>
                {[{ label:`Base drain (${result.irrigation} mode)`, val:result.drainBreakdown?.baseDrain, color:"#555" }, { label:"Stress addition", val:result.drainBreakdown?.stressDrain, color:"#C62828" }, { label:"Temperature boost", val:result.drainBreakdown?.tempDrain, color:"#E65100" }, { label:"Dry soil load", val:result.drainBreakdown?.soilDrain, color:"#2E7D32" }].map((d,i) => (d.val>0) && (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:".73rem", padding:"3px 0", borderBottom:i<3?"1px dashed #E1BEE7":"none" }}>
                    <span style={{ color:"#666" }}>· {d.label}</span>
                    <span style={{ color:d.color, fontWeight:700 }}>+{d.val}%</span>
                  </div>
                ))}
              </div>

              {result.batteryAlerts?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  {result.batteryAlerts.map((a,i) => (
                    <div key={i} style={{ background:a.color+"12", border:`2px solid ${a.color}`, borderRadius:11, padding:"11px 14px", marginBottom:9 }}>
                      <div style={{ fontWeight:800, color:a.color, fontSize:".82rem" }}>{a.message}</div>
                      <div style={{ fontSize:".72rem", color:"#666", marginTop:4, fontStyle:"italic" }}>➤ {a.action}</div>
                    </div>
                  ))}
                </div>
              )}

              {result.batResult && (
                <div style={{ marginBottom:14 }}>
                  <BatteryCard label="🔋 Current Battery Life" pct={result.form.battery} result={result.batResult} compact onSpeak={() => window.VoiceAssistant?.speakBatteryStatus?.(result.batResult)} />
                </div>
              )}

              <div className="card" style={{ marginBottom:14 }}>
                <div className="card__label" style={{ marginBottom:10 }}>Prediction Confidence by Class</div>
                <ProbabilityBars probabilities={result.probabilities} />
              </div>

              {result.tips?.length > 0 && <TipCard tips={result.tips} onSpeak={(en,hi) => window.VoiceAssistant?.speakBilingual?.(en,hi)} />}
            </div>
          ) : (
            <div className="card empty-state" style={{ minHeight:460 }}>
              <div className="empty-state__icon">🤖</div>
              <h3 className="empty-state__title">Awaiting Prediction</h3>
              <p className="empty-state__sub">Move the sliders — stress &amp; predicted battery update live.<br/>Choose Single or Multi-Task mode, then click Run Prediction.</p>
              <div style={{ marginTop:16, padding:"14px 16px", background:"#F5F0E8", borderRadius:12, maxWidth:360, textAlign:"left", width:"100%" }}>
                <div style={{ fontWeight:800, fontSize:".78rem", color:"#6D4C41", marginBottom:8 }}>📊 Live Preview</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                  {[{ label:"Stress Index", val:`${liveBreak.total}/250`, color:liveBreak.levelColor }, { label:"Stress Level", val:liveBreak.level||sl.label, color:liveBreak.levelColor }, { label:"Pred Battery", val:`${livePredBat.predBattery}%`, color:"#8E24AA" }, { label:"Drain/cycle", val:`${livePredBat.drainPerCycle}%`, color:"#C62828" }, { label:"Task Mode", val:taskMode.toUpperCase(), color:taskMode==="single"?"#1565C0":"#1B5E20" }, { label:"Active Procs", val:`${taskMode==="single"?SINGLE_PROCS.length:MULTI_PROCS.length}`, color:"#555" }].map((item,i) => (
                    <div key={i} style={{ background:"white", borderRadius:8, padding:"7px 10px", border:"1px solid #E0DDD7" }}>
                      <div style={{ fontSize:".6rem", color:"#aaa" }}>{item.label}</div>
                      <div style={{ fontWeight:800, color:item.color, fontSize:".85rem" }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
