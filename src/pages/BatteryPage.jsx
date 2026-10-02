import { useState, useEffect, useMemo } from 'react';
import BatteryVisual from '../components/BatteryVisual.jsx';
import BatteryCard from '../components/BatteryCard.jsx';
import ChartCanvas from '../components/ChartCanvas.jsx';
import { REAL_DATA } from '../logic/realData';

const NODE_COLORS = ["#C62828","#E65100","#F9A825","#2E7D32","#0277BD","#6A1B9A","#455A64"];

function fmtDur(sec) {
  if (sec < 60)   return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec/60)}m ${sec%60}s`;
  return `${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m ${sec%60}s`;
}
function fmtTimer(sec) {
  const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

const MODE_LABELS = { HIGH:"High irrigation", MEDIUM:"Medium", LOW:"Low", MIN:"Battery-save", DEFAULT:"Average" };

function NodeCard({ nodeId, nodeData, liveState, onToggle, onRefresh }) {
  const [farmerInput,  setFarmerInput]  = useState("");
  const [showSessions, setShowSessions] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const BP = window.BatteryPredictor;

  if (!liveState) return null;
  const { isOn, currentBattery, hoursInt, minutesRemainder, status, barColor, fault, smart, sessions, currentSession, sessionCount, totalOnSeconds, elapsedSeconds, replacementDate } = liveState;
  const handover = BP.getHandoverSummary(nodeId);

  return (
    <div className="card" style={{ borderLeft:`5px solid ${isOn?barColor:"#CCC"}`, padding:16, transition:"border-color .3s" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:".88rem" }}>📡 {nodeId}</div>
          <div style={{ fontSize:".67rem", color:"#aaa", marginTop:2 }}>{nodeData.location} · 🌾 {nodeData.cropType}</div>
        </div>
        <button onClick={() => onToggle(nodeId, farmerInput||liveState.farmerName)} style={{ background:isOn?"#C62828":"#2E7D32", color:"white", border:"none", borderRadius:10, padding:"7px 16px", fontFamily:"var(--font-display)", fontWeight:800, fontSize:".78rem", cursor:"pointer", boxShadow:`0 4px 12px ${isOn?"rgba(198,40,40,.3)":"rgba(46,125,50,.3)"}`, transition:"all .2s" }}>
          {isOn?"⏹ OFF":"▶ ON"}
        </button>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
        <div style={{ width:9, height:9, borderRadius:"50%", background:isOn?"#4CAF50":"#999", boxShadow:isOn?"0 0 7px #4CAF50":"none", animation:isOn?"livePulse 1.5s infinite":"none" }}/>
        <span style={{ fontSize:".74rem", fontWeight:700, color:isOn?"#2E7D32":"#999" }}>{isOn?"● ONLINE — draining":"○ OFFLINE — paused"}</span>
        {liveState.activeProcessIds && (
          <span style={{ marginLeft:"auto", fontSize:".67rem", fontWeight:800, background:liveState.activeProcessIds.length<=3?"#E8F5E9":"#E3F2FD", color:liveState.activeProcessIds.length<=3?"#2E7D32":"#0277BD", padding:"2px 8px", borderRadius:8 }}>
            {liveState.activeProcessIds.length<=3?"1️⃣ Single":"🔀 Multi"} ({liveState.activeProcessIds.length} procs)
          </span>
        )}
      </div>
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:8 }}>
        <BatteryVisual pct={Math.round(currentBattery)} color={barColor} size="sm"/>
        <div>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.4rem", color:isOn?barColor:"#888", lineHeight:1 }}>{hoursInt}h {minutesRemainder}m</div>
          <div style={{ fontSize:".7rem", color:"#888", marginTop:2 }}>{currentBattery.toFixed(isOn?3:1)}% · {replacementDate}</div>
          {isOn && elapsedSeconds > 0 && <div style={{ fontSize:".67rem", color:"#0277BD", fontFamily:"var(--font-display)", fontWeight:700, marginTop:2 }}>⏱ {fmtTimer(elapsedSeconds)}</div>}
        </div>
        <div style={{ marginLeft:"auto", textAlign:"right" }}>
          <div style={{ fontSize:".6rem", color:"#aaa" }}>Drain/cycle</div>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:".88rem", color:barColor }}>{liveState.drainPerCycle?.toFixed(3)}%</div>
        </div>
      </div>
      <div style={{ background:"#EEE", borderRadius:5, height:5, overflow:"hidden", marginBottom:8 }}>
        <div style={{ height:"100%", width:`${Math.min(100,Math.max(0,currentBattery))}%`, background:isOn?barColor:"#BBB", borderRadius:5, transition:isOn?"width 1s linear":"none" }}/>
      </div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:6 }}>
        {[{i:"💧",v:`${nodeData.soilMoisture}%`,c:"#2E7D32"},{i:"🌡️",v:`${nodeData.temperature}°C`,c:"#C62828"},{i:"☁️",v:`${nodeData.humidity}%`,c:"#0277BD"},{i:"🌿",v:`${nodeData.stress}`,c:"#6D4C41"}].map((x,j)=>(<span key={j} style={{ background:"#F5F5F5", borderRadius:6, padding:"2px 6px", fontSize:".67rem", fontWeight:600, color:x.c }}>{x.i} {x.v}</span>))}
        <span className={`irr-badge irr-badge--${nodeData.irrigation}`} style={{ fontSize:".67rem", padding:"2px 8px" }}>{nodeData.irrigation}</span>
      </div>
      {fault?.faultLevel !== "NORMAL" && (
        <div style={{ background:"#FFEBEE", border:"1px solid #EF9A9A", borderRadius:8, padding:"5px 9px", marginBottom:6, fontSize:".7rem", color:"#C62828", fontWeight:700 }}>
          {fault.faultMessage}
          {fault.faultAction && <div style={{ fontWeight:400, color:"#888", marginTop:1 }}>{fault.faultAction}</div>}
        </div>
      )}
      {isOn && currentSession && (
        <div style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:8, padding:"6px 10px", marginBottom:6 }}>
          <div style={{ fontWeight:800, fontSize:".72rem", color:"#1B5E20" }}>🟢 {currentSession.sessionId} · {currentSession.farmerName}</div>
          <div style={{ fontSize:".67rem", color:"#555", marginTop:2 }}>Started: {currentSession.startTimeDisplay} · Bat at start: {currentSession.batteryAtStart?.toFixed(1)}%</div>
        </div>
      )}
      {!isOn && (
        <input type="text" value={farmerInput} onChange={e=>setFarmerInput(e.target.value)} placeholder="👤 Next farmer name..." style={{ width:"100%", padding:"6px 10px", borderRadius:8, border:"1.5px solid #E0DDD7", fontSize:".78rem", fontFamily:"var(--font-display)", fontWeight:600, marginBottom:8, boxSizing:"border-box" }}/>
      )}
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:7 }}>
        <span style={{ background:"#F0F4FF", borderRadius:7, padding:"3px 8px", fontSize:".67rem", fontWeight:700, color:"#3949AB" }}>📋 {sessionCount} session{sessionCount!==1?"s":""}</span>
        {totalOnSeconds>0 && <span style={{ background:"#FFF3E0", borderRadius:7, padding:"3px 8px", fontSize:".67rem", fontWeight:700, color:"#E65100" }}>⏱ {fmtDur(totalOnSeconds)}</span>}
      </div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {sessions.length>0 && <button onClick={()=>setShowSessions(s=>!s)} style={{ flex:1, background:"transparent", border:"1.5px solid #E0DDD7", borderRadius:7, padding:"4px 8px", fontSize:".67rem", fontWeight:700, cursor:"pointer", color:"#555" }}>{showSessions?"▲ Log":`📋 Log(${sessions.length})`}</button>}
        {handover && <button onClick={()=>setShowHandover(s=>!s)} style={{ flex:1, background:"transparent", border:"1.5px dashed #FFD54F", borderRadius:7, padding:"4px 8px", fontSize:".67rem", fontWeight:700, cursor:"pointer", color:"#BF6000" }}>{showHandover?"▲ Handover":"📤 Handover"}</button>}
      </div>
      {showSessions && sessions.length>0 && (
        <div style={{ marginTop:8, overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".67rem" }}>
            <thead><tr style={{ background:"#F5F0EA" }}>{["ID","Farmer","Start","End","Duration","Bat▼","Used"].map(h=><th key={h} style={{ padding:"4px 6px", textAlign:"left", color:"#888", fontWeight:700, whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>{sessions.map((s,i)=><tr key={i} style={{ borderBottom:"1px solid #F0EDE8" }}><td style={{ padding:"4px 6px", fontWeight:800, color:"#3949AB" }}>{s.sessionId}</td><td style={{ padding:"4px 6px", fontWeight:600 }}>{s.farmerName}</td><td style={{ padding:"4px 6px" }}>{s.startTimeDisplay}</td><td style={{ padding:"4px 6px" }}>{s.endTimeDisplay||"—"}</td><td style={{ padding:"4px 6px", fontWeight:700, color:"#2E7D32" }}>{s.durationDisplay}</td><td style={{ padding:"4px 6px", fontWeight:700 }}>{s.batteryAtStart?.toFixed(1)}→{s.batteryAtEnd?.toFixed(1)||"—"}%</td><td style={{ padding:"4px 6px", fontWeight:700, color:"#C62828" }}>-{s.batteryConsumed||0}%</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {showHandover && handover && (
        <div style={{ marginTop:8, background:"#FFFDE7", border:"1.5px solid #FFD54F", borderRadius:10, padding:"10px 14px" }}>
          <div style={{ fontWeight:800, fontSize:".78rem", color:"#BF6000", marginBottom:6 }}>📤 Handover for Next Farmer</div>
          <div style={{ fontSize:".74rem", color:"#555", lineHeight:1.7 }}>{handover.handoverMessage}</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
            {[{l:"Sessions",v:handover.totalSessions},{l:"ON Time",v:`${Math.floor(handover.totalOnMinutes/60)}h ${handover.totalOnMinutes%60}m`},{l:"Used",v:`${handover.totalBatteryUsed}%`},{l:"Left",v:`${handover.currentBattery.toFixed(1)}%`}].map((x,i)=>(<div key={i} style={{ background:"white", borderRadius:8, padding:"5px 10px", border:"1px solid #FFD54F", textAlign:"center" }}><div style={{ fontSize:".6rem", color:"#aaa" }}>{x.l}</div><div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:".85rem", color:"#BF6000" }}>{x.v}</div></div>))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BatteryPage({ history }) {
  const [tick,        setTick]        = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [globalFarmer,setGlobalFarmer]= useState("Farmer");
  const [form, setForm] = useState({ battery:80, predBattery:74, mode:"DEFAULT", interval:10 });
  const [calcResult, setCalcResult]   = useState(null);
  const [chartData,  setChartData]    = useState(null);

  const NODES = window.SampleData.SENSOR_NODES;
  const BP    = window.BatteryPredictor;

  useEffect(() => {
    if (!initialized) { NODES.forEach(n => BP.initNode(n, globalFarmer)); setInitialized(true); }
    const id = setInterval(()=>setTick(t=>t+1), 1000);
    return ()=>clearInterval(id);
  }, []);

  const liveStates = useMemo(() => {
    const s={}; NODES.forEach(n=>{ s[n.nodeId]=BP.getLiveNodeState(n.nodeId); }); return s;
  }, [tick]);
    const coojaBattery = useMemo(() => {
    const ids = [...new Set(REAL_DATA.map(r => r.node))].sort((a, b) => a - b);
    const series = ids.map(id =>
      REAL_DATA.filter(r => r.node === id).sort((a, b) => a.time - b.time).map(r => r.bat));
    const maxLen = Math.max(...series.map(s => s.length));
    const summary = ids.map((id, i) => ({
      id, start: series[i][0], end: series[i][series[i].length - 1], n: series[i].length,
    }));
    const cfg = {
      type: "line",
      data: {
        labels: Array.from({ length: maxLen }, (_, i) => i + 1),
        datasets: ids.map((id, i) => ({
          label: `Node ${id}`, data: series[i],
          borderColor: NODE_COLORS[i % 7], backgroundColor: NODE_COLORS[i % 7],
          tension: .3, pointRadius: 0, borderWidth: 2, fill: false,
        })),
      },
      options: {
        plugins: { legend: { position: "top" } },
        scales: {
          y: { min: 0, max: 100, ticks: { callback: v => v + "%" } },
          x: { ticks: { maxTicksLimit: 10 }, title: { display: true, text: "Reading # (≈15 s of Cooja time each)" } },
        },
        animation: { duration: 400 },
      },
    };
    return { cfg, summary };
  }, []);

  const handleToggle = (nodeId, farmerName) => {
    const s = liveStates[nodeId]; if (!s) return;
    if (s.isOn) BP.turnNodeOff(nodeId, `Session ended. Next: ${globalFarmer}`);
    else        BP.turnNodeOn(nodeId, farmerName||globalFarmer);
    setTick(t=>t+1);
  };

  const onCount  = Object.values(liveStates).filter(s=>s?.isOn).length;
  const offCount = NODES.length - onCount;
  const allSessions = NODES.flatMap(n => (BP.nodeRegistry[n.nodeId]?.sessions||[]).map(s=>({...s,nodeId:n.nodeId}))).sort((a,b)=>b.startTime-a.startTime);

  const handleCalc = () => {
    const r  = BP.estimateBatteryLife(form.battery, form.predBattery, form.mode, form.interval);
    const cd = BP.getBatteryChartData(form.battery, form.mode, form.interval);
    setCalcResult(r); setChartData(cd);
  };

  const drainChartCfg = chartData ? {
    type:"line", data:{ labels:chartData.timestamps||chartData.hours.map(h=>h+"h"), datasets:[{label:"Battery %",data:chartData.levels,borderColor:"#2E7D32",backgroundColor:"rgba(46,125,50,.08)",fill:true,tension:.4,pointRadius:3}]}, options:{plugins:{legend:{display:false}},scales:{y:{min:0,max:100,ticks:{callback:v=>v+"%"}},x:{ticks:{maxTicksLimit:6}}},animation:{duration:400}},
  } : null;

  return (
    <main className="page">
      <div className="page__header">
        <div className="page__label">Real-Time Node Control · 7 Processes</div>
        <h2 className="page__title">Battery + Task Manager</h2>
        <p className="page__sub">Dynamic Single / Multi-Task per node · Session handover · GPS &amp; SD Logger removed</p>
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:20 }}>
        <div style={{ background:"#1A2E1C", color:"#66BB6A", borderRadius:10, padding:"7px 14px", fontFamily:"var(--font-display)", fontWeight:800, fontSize:".82rem" }}>⏱ {Math.floor(tick/3600)}h {Math.floor((tick%3600)/60)}m {tick%60}s</div>
        <div style={{ background:"#E8F5E9", borderRadius:10, padding:"7px 12px", fontSize:".78rem", fontWeight:700, color:"#2E7D32" }}>🟢 {onCount} ON</div>
        <div style={{ background:"#F5F5F5", borderRadius:10, padding:"7px 12px", fontSize:".78rem", fontWeight:700, color:"#888" }}>⚫ {offCount} OFF</div>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginLeft:"auto" }}>
          <span style={{ fontSize:".75rem", color:"#888", fontWeight:600 }}>👤</span>
          <input type="text" value={globalFarmer} onChange={e=>setGlobalFarmer(e.target.value)} placeholder="Farmer name" style={{ padding:"6px 10px", borderRadius:8, border:"1.5px solid #E0DDD7", fontSize:".8rem", fontWeight:700, width:150 }}/>
        </div>
        <button onClick={()=>{NODES.forEach(n=>{const s=liveStates[n.nodeId];if(s&&!s.isOn)BP.turnNodeOn(n.nodeId,globalFarmer)});setTick(t=>t+1);}} className="btn btn--primary btn--sm">▶ All ON</button>
        <button onClick={()=>{NODES.forEach(n=>{const s=liveStates[n.nodeId];if(s&&s.isOn)BP.turnNodeOff(n.nodeId,`Batch OFF by ${globalFarmer}`)});setTick(t=>t+1);}} style={{ background:"#C62828", color:"white", border:"none", borderRadius:10, padding:"7px 14px", fontFamily:"var(--font-display)", fontWeight:800, fontSize:".8rem", cursor:"pointer" }}>⏹ All OFF</button>
      </div>

      <div className="grid-3" style={{ marginBottom:24 }}>
        {NODES.map(node=>(
          <NodeCard key={node.nodeId} nodeId={node.nodeId} nodeData={node} liveState={liveStates[node.nodeId]} onToggle={handleToggle} onRefresh={()=>setTick(t=>t+1)}/>
        ))}
      </div>
              <div className="card" style={{ marginBottom:24 }}>
        <div className="card__label" style={{ marginBottom:10 }}>
          🛰️ Cooja (Contiki) — Real Battery Drain per Node
        </div>
        <ChartCanvas id="coojaBattery" config={coojaBattery.cfg} height="260px" />
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:12 }}>
          {coojaBattery.summary.map((s, i) => (
            <span key={s.id} style={{ background:"#F5F5F5", borderRadius:8, padding:"4px 10px", fontSize:".7rem", fontWeight:700, color:NODE_COLORS[i % 7] }}>
              Node {s.id}: {s.start}% → {s.end}% ({s.n} readings)
            </span>
          ))}
        </div>
        <p style={{ fontSize:".65rem", color:"#aaa", marginTop:8 }}>
          Source: Cooja simulation log (output.log), one line per node. Battery value as reported by each mote.
        </p>
      </div>
      
      {allSessions.length>0 && (
        <div className="card" style={{ marginBottom:24 }}>
          <div className="card__label" style={{ marginBottom:12 }}>📋 Farm Operation Log — All Sessions</div>
          <div className="overflow-x">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Node</th><th>Farmer</th><th>Date</th><th>Start</th><th>End</th><th>Duration</th><th>Bat Start</th><th>Bat End</th><th>Used</th><th>Mode</th></tr></thead>
              <tbody>
                {allSessions.slice(0,20).map((s,i)=>(
                  <tr key={i}>
                    <td style={{ fontWeight:800, color:"#3949AB" }}>{s.sessionId}</td>
                    <td style={{ fontSize:".7rem", color:"#555" }}>{s.nodeId.split("—")[0].trim().replace("Node #","N#")}</td>
                    <td style={{ fontWeight:600 }}>{s.farmerName}</td>
                    <td style={{ fontSize:".7rem" }}>{s.startDate}</td>
                    <td>{s.startTimeDisplay}</td>
                    <td>{s.endTimeDisplay||"Active"}</td>
                    <td style={{ fontWeight:700, color:"#2E7D32" }}>{s.durationDisplay}</td>
                    <td style={{ fontWeight:700 }}>{s.batteryAtStart?.toFixed(1)}%</td>
                    <td style={{ fontWeight:700, color:"#E65100" }}>{s.batteryAtEnd?.toFixed(1)||"—"}%</td>
                    <td style={{ fontWeight:700, color:"#C62828" }}>-{s.batteryConsumed||0}%</td>
                    <td><span className={`irr-badge irr-badge--${s.irrigationMode}`} style={{ fontSize:".65rem", padding:"1px 7px" }}>{s.irrigationMode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid-battery">
        <div className="card">
          <div className="card__label" style={{ marginBottom:14 }}>⚡ Battery Calculator</div>
          {[{k:"battery",l:"🔋 Battery",u:"%",min:0,max:100,c:"#E65100"},{k:"predBattery",l:"⚡ PredBattery",u:"%",min:0,max:100,c:"#777"}].map(s=>(
            <div key={s.k} className="slider-group">
              <div className="slider-group__top"><span className="slider-group__name">{s.l}</span><span className="slider-group__value" style={{color:s.c}}>{form[s.k]}{s.u}</span></div>
              <input type="range" min={s.min} max={s.max} value={form[s.k]} style={{background:`linear-gradient(to right,${s.c} ${((form[s.k]-s.min)/(s.max-s.min))*100}%,#DDD 0)`}} onChange={e=>setForm(p=>({...p,[s.k]:+e.target.value}))}/>
            </div>
          ))}
          <div className="slider-group">
            <div className="slider-group__name" style={{marginBottom:8}}>Mode</div>
            <select value={form.mode} onChange={e=>setForm(p=>({...p,mode:e.target.value}))}>
              {Object.entries(MODE_LABELS).map(([m,l])=><option key={m} value={m}>{m} — {l}</option>)}
            </select>
          </div>
          <div className="slider-group">
            <div className="slider-group__name" style={{marginBottom:8}}>Interval</div>
            <select value={form.interval} onChange={e=>setForm(p=>({...p,interval:+e.target.value}))}>
              {[1,5,10,15,30,60].map(v=><option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <button className="btn btn--primary btn--full" onClick={handleCalc}>⚡ Calculate</button>
        </div>
        <div>
          {calcResult ? (
            <div className="card anim-fade">
              <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:12}}>
                <BatteryVisual pct={form.battery} color={calcResult.barColor} size="md"/>
                <div>
                  <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"2rem",color:calcResult.barColor,lineHeight:1}}>{calcResult.hoursInt}h {calcResult.minutesRemainder}m</div>
                  <div style={{color:"#888",marginTop:3}}>= {calcResult.daysRemaining} days</div>
                  <span className="badge" style={{background:calcResult.barColor+"22",color:calcResult.barColor,marginTop:7,display:"inline-block",padding:"3px 10px"}}>{calcResult.status}</span>
                  <div style={{fontWeight:700,color:"#444",marginTop:7}}>{calcResult.replacementDate}</div>
                </div>
              </div>
              <div className="battery-alert">{calcResult.alertMessage}</div>
              {drainChartCfg && <div style={{marginTop:12}}><div className="card__label" style={{marginBottom:8}}>Drain Over Time</div><ChartCanvas id="calcChart" config={drainChartCfg} height="170px"/></div>}
            </div>
          ) : (
            <div className="card empty-state" style={{minHeight:200}}>
              <div className="empty-state__icon">⚡</div>
              <p className="empty-state__sub">Set parameters and click Calculate</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
