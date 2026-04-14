/**
 * logic/batteryPredictor.js  — FINAL OPTIMIZED (GPS + SD removed)
 * =================================================================
 * 7 WSN Processes (GPS Logger and SD Card Logger removed):
 *   P1 soil_read     — Soil Moisture Reading   (core)
 *   P2 temp_read     — Temperature Reading     (core)
 *   P3 hum_read      — Humidity Reading        (core)
 *   P4 pump_control  — Irrigation Pump Control (actuation)
 *   P5 radio_tx      — Radio Transmission      (comms)
 *   P6 battery_chk   — Battery Level Check     (monitoring)
 *   P7 ml_predict    — ML Prediction Compute   (compute, optional)
 *
 * SINGLE TASKING:  runs P1+P2+P3 only → baseline drain, best accuracy
 * MULTI TASKING:   runs P1–P7 → higher drain, optimizer keeps it close
 *
 * DURING IRRIGATION:
 *   pump_control is ACTIVE → adds 1.80%/cycle drain
 *   radio_tx transmits results → 0.90%/cycle drain
 *   Both affect sensor readings via noise
 */

const DRAIN_BY_MODE = {
  HIGH:    4.74,
  MEDIUM:  4.57,
  LOW:     4.38,
  MIN:     7.27,
  DEFAULT: 4.715,
};

const DEFAULT_INTERVAL_MINUTES = 10;
const BATTERY_THRESHOLDS = { HIGH:75, LOW:30, CRITICAL:15 };

// ─────────────────────────────────────────────────────────────
//  PROCESS CATALOG — 7 processes (GPS + SD removed)
// ─────────────────────────────────────────────────────────────
const PROCESS_CATALOG = {
  soil_read:    { id:"soil_read",    name:"Soil Moisture Reading", icon:"💧", priority:1, baseDrain:0.80, dutyCycle:1.0,  canSkip:false, category:"sensing"   },
  temp_read:    { id:"temp_read",    name:"Temperature Reading",   icon:"🌡️", priority:1, baseDrain:0.60, dutyCycle:1.0,  canSkip:false, category:"sensing"   },
  hum_read:     { id:"hum_read",     name:"Humidity Reading",      icon:"☁️", priority:1, baseDrain:0.55, dutyCycle:1.0,  canSkip:false, category:"sensing"   },
  pump_control: { id:"pump_control", name:"Irrigation Pump",       icon:"🚰", priority:2, baseDrain:1.80, dutyCycle:1.0,  canSkip:false, category:"actuation" },
  radio_tx:     { id:"radio_tx",     name:"Radio Transmission",    icon:"📡", priority:2, baseDrain:0.90, dutyCycle:1.0,  canSkip:false, category:"comms"     },
  battery_chk:  { id:"battery_chk",  name:"Battery Level Check",   icon:"🔋", priority:3, baseDrain:0.10, dutyCycle:1.0,  canSkip:false, category:"monitoring"},
  ml_predict:   { id:"ml_predict",   name:"ML Prediction Compute", icon:"🧠", priority:3, baseDrain:0.40, dutyCycle:0.33, canSkip:true,  category:"compute"   },
};

// ─────────────────────────────────────────────────────────────
//  OPTIMIZATION STRATEGIES
// ─────────────────────────────────────────────────────────────
const OPTIMIZATION_STRATEGIES = {
  NONE: {
    id:"NONE", name:"No Optimization",
    description:"All processes at full power every cycle",
    icon:"🔴", dutyCycleMultiplier:1.0, drainMultiplier:1.0,
    sleepBetweenCycles:false, batchTransmissions:false, cacheMLResults:false,
  },
  LIGHT: {
    id:"LIGHT", name:"Light Optimizer",
    description:"Low-priority processes skip every other cycle",
    icon:"🟡", dutyCycleMultiplier:0.65, drainMultiplier:0.90,
    sleepBetweenCycles:false, batchTransmissions:false, cacheMLResults:false,
  },
  MEDIUM: {
    id:"MEDIUM", name:"Smart Scheduler",
    description:"Duty cycling + radio batching + ML caching",
    icon:"🟢", dutyCycleMultiplier:0.45, drainMultiplier:0.82,
    sleepBetweenCycles:false, batchTransmissions:true, cacheMLResults:true,
  },
  AGGRESSIVE: {
    id:"AGGRESSIVE", name:"Deep Optimizer",
    description:"Maximum duty cycling + sleep scheduling",
    icon:"💚", dutyCycleMultiplier:0.30, drainMultiplier:0.72,
    sleepBetweenCycles:true, batchTransmissions:true, cacheMLResults:true,
  },
};

// ─────────────────────────────────────────────────────────────
//  MULTI-PROCESS DRAIN CALCULATOR
//  Single vs Multi comparison with optimizer
// ─────────────────────────────────────────────────────────────
function calculateMultiProcessDrain(activeProcessIds, irrigationMode, batteryPct, strategyId="MEDIUM") {
  const strategy      = OPTIMIZATION_STRATEGIES[strategyId] || OPTIMIZATION_STRATEGIES.MEDIUM;
  const singleDrain   = DRAIN_BY_MODE[irrigationMode] || DRAIN_BY_MODE.DEFAULT;
  let rawMultiDrain   = 0;
  let optimizedDrain  = 0;
  const details       = [];

  activeProcessIds.forEach(pid => {
    const proc = PROCESS_CATALOG[pid];
    if (!proc) return;

    const rawD = proc.baseDrain * proc.dutyCycle;
    rawMultiDrain += rawD;

    let effDuty  = proc.dutyCycle * strategy.dutyCycleMultiplier;
    let effDrain = proc.baseDrain * strategy.drainMultiplier;
    if (!proc.canSkip) { effDuty = proc.dutyCycle; effDrain = proc.baseDrain; }
    if (proc.id==="radio_tx" && strategy.batchTransmissions) effDrain *= 0.60;
    if (proc.id==="ml_predict" && strategy.cacheMLResults)   effDuty  *= 0.33;
    const sleep     = strategy.sleepBetweenCycles ? 0.92 : 1.0;
    const finalD    = effDrain * effDuty * sleep;
    optimizedDrain += finalD;

    details.push({
      ...proc,
      rawDrain:         parseFloat(rawD.toFixed(4)),
      optimizedDrain:   parseFloat(finalD.toFixed(4)),
      effectiveDuty:    parseFloat(effDuty.toFixed(3)),
      skipped:          effDuty < proc.dutyCycle,
    });
  });

  const skipped          = details.filter(d=>d.skipped).length;
  const accuracyLoss     = skipped * 0.05;
  const optimizedAccuracy= parseFloat(Math.max(97.0, 98.33 - accuracyLoss).toFixed(2));
  const rawOverhead      = rawMultiDrain / singleDrain;
  const optOverhead      = optimizedDrain / singleDrain;
  const dphOpt           = optimizedDrain * (60/DEFAULT_INTERVAL_MINUTES);
  const dphRaw           = rawMultiDrain  * (60/DEFAULT_INTERVAL_MINUTES);
  const dphSingle        = singleDrain    * (60/DEFAULT_INTERVAL_MINUTES);

  return {
    singleProcessDrain:   parseFloat(singleDrain.toFixed(3)),
    rawMultiDrain:        parseFloat(rawMultiDrain.toFixed(3)),
    optimizedMultiDrain:  parseFloat(optimizedDrain.toFixed(3)),
    drainSaved:           parseFloat((rawMultiDrain - optimizedDrain).toFixed(3)),
    savingPercent:        rawMultiDrain>0 ? parseFloat(((rawMultiDrain-optimizedDrain)/rawMultiDrain*100).toFixed(1)):0,
    rawOverhead:          parseFloat(rawOverhead.toFixed(2)),
    optimizedOverhead:    parseFloat(optOverhead.toFixed(2)),
    closenessToBaseline:  parseFloat((100 - Math.abs(optimizedDrain-singleDrain)/singleDrain*100).toFixed(1)),
    hoursSingle:          parseFloat((batteryPct/dphSingle).toFixed(1)),
    hoursRaw:             parseFloat((batteryPct/dphRaw).toFixed(1)),
    hoursOptimized:       parseFloat((batteryPct/dphOpt).toFixed(1)),
    hoursGained:          parseFloat((batteryPct/dphOpt - batteryPct/dphRaw).toFixed(1)),
    baseAccuracy:         98.33,
    optimizedAccuracy,
    accuracyLoss:         parseFloat(accuracyLoss.toFixed(2)),
    strategy, processDetails:details,
    activeCount:          activeProcessIds.length,
    skippedCount:         skipped,
    criticalCount:        details.filter(d=>!d.skipped).length,
  };
}

// ─────────────────────────────────────────────────────────────
//  NODE REGISTRY — ON/OFF + SESSION ENGINE
// ─────────────────────────────────────────────────────────────
const nodeRegistry = {};

function initNode(node, farmerName="Farmer") {
  const drain = DRAIN_BY_MODE[node.irrigation] || DRAIN_BY_MODE.DEFAULT;
  const dph   = drain * (60 / DEFAULT_INTERVAL_MINUTES);
  if (!nodeRegistry[node.nodeId]) {
    nodeRegistry[node.nodeId] = {
      nodeId:node.nodeId, isOn:false,
      startBattery:node.battery, currentBattery:node.battery,
      drainPerHour:dph, drainPerCycle:drain,
      onSince:null, totalOnSeconds:0,
      sessions:[], currentSession:null,
      farmerName, irrigation:node.irrigation,
      soilMoisture:node.soilMoisture, temperature:node.temperature,
      humidity:node.humidity, stress:node.stress,
      activeProcessIds:["soil_read","temp_read","hum_read","radio_tx","battery_chk"],
      strategyId:"MEDIUM", multiProcessResult:null,
    };
  }
  return nodeRegistry[node.nodeId];
}

function turnNodeOn(nodeId, farmerName="Farmer") {
  const reg = nodeRegistry[nodeId];
  if (!reg || reg.isOn) return { success:false };
  const now = Date.now();
  const sn  = reg.sessions.length + 1;
  const session = {
    sessionId:`S${sn}`, sessionNumber:sn, farmerName,
    startTime:now, startTimeDisplay:new Date(now).toLocaleTimeString("en-IN"),
    startDate:new Date(now).toLocaleDateString("en-IN"),
    endTime:null, endTimeDisplay:null, durationSeconds:0,
    durationDisplay:"Active...", batteryAtStart:reg.currentBattery,
    batteryAtEnd:null, batteryConsumed:null,
    irrigationMode:reg.irrigation, prediction:null,
    handoverNote:"", status:"ACTIVE",
    activeProcesses:[...reg.activeProcessIds], strategyId:reg.strategyId,
  };
  reg.isOn=true; reg.onSince=now; reg.currentSession=session;
  return { success:true, sessionId:session.sessionId };
}

function turnNodeOff(nodeId, handoverNote="") {
  const reg = nodeRegistry[nodeId];
  if (!reg || !reg.isOn) return { success:false };
  const now  = Date.now();
  const s    = reg.currentSession;
  const dSec = Math.floor((now - s.startTime)/1000);
  const dh   = dSec/3600;
  const used = parseFloat((reg.drainPerHour*dh).toFixed(4));
  const endB = parseFloat(Math.max(0, s.batteryAtStart - used).toFixed(2));
  const dMin = Math.floor(dSec/60), dS = dSec%60;
  const durStr = dMin>0?(Math.floor(dMin/60)>0?`${Math.floor(dMin/60)}h `:"")+ `${dMin%60}m ${dS}s`:`${dS}s`;
  s.endTime=now; s.endTimeDisplay=new Date(now).toLocaleTimeString("en-IN");
  s.durationSeconds=dSec; s.durationDisplay=durStr;
  s.batteryAtEnd=endB; s.batteryConsumed=parseFloat(used.toFixed(3));
  s.handoverNote=handoverNote||`Ran for ${durStr}. Battery: ${s.batteryAtStart.toFixed(1)}%→${endB.toFixed(1)}%`;
  s.status="CLOSED";
  reg.sessions.push({...s}); reg.totalOnSeconds+=dSec;
  reg.currentBattery=endB; reg.isOn=false; reg.currentSession=null; reg.onSince=null;
  return { success:true, session:{...s} };
}

function setNodeProcesses(nodeId, processIds, strategyId) {
  const reg = nodeRegistry[nodeId];
  if (!reg) return;
  reg.activeProcessIds = processIds;
  reg.strategyId       = strategyId;
  const result = calculateMultiProcessDrain(processIds, reg.irrigation, reg.currentBattery, strategyId);
  reg.drainPerHour    = result.optimizedMultiDrain * (60/DEFAULT_INTERVAL_MINUTES);
  reg.drainPerCycle   = result.optimizedMultiDrain;
  reg.multiProcessResult = result;
}

function getLiveNodeState(nodeId) {
  const reg = nodeRegistry[nodeId];
  if (!reg) return null;
  let bat = reg.currentBattery, elapsed = 0;
  if (reg.isOn && reg.onSince) {
    elapsed = (Date.now() - reg.onSince)/1000;
    bat     = Math.max(0, reg.currentBattery - reg.drainPerHour*(elapsed/3600));
  }
  const dph  = reg.drainPerHour;
  const hrs  = dph>0?bat/dph:9999, days=hrs/24, mins=Math.floor((hrs%1)*60);
  let status, barColor;
  if (bat<=15||hrs<2){status="CRITICAL";barColor="#C62828";}
  else if(bat<=30||hrs<6){status="LOW";barColor="#E65100";}
  else if(bat<=50||hrs<12){status="MEDIUM";barColor="#0277BD";}
  else if(bat<=75){status="GOOD";barColor="#2E7D32";}
  else{status="EXCELLENT";barColor="#1B5E20";}
  const fault = getFaultRisk(bat, hrs, reg.drainPerCycle);
  const smart = getSmartPriority(reg.soilMoisture, bat, reg.irrigation, reg.stress);
  const totalOn = reg.totalOnSeconds + (reg.isOn ? elapsed : 0);
  const rep = days<1?"Replace TODAY":days<3?`In ${Math.floor(days)+1} days`:days<7?`In ${Math.floor(days)} days`:days<30?`In ~${Math.floor(days/7)} wk(s)`:`In ~${Math.floor(days/30)} mo(s)`;
  return {
    nodeId, isOn:reg.isOn, currentBattery:+bat.toFixed(3),
    startBattery:reg.startBattery, hoursRemaining:+hrs.toFixed(2),
    daysRemaining:+days.toFixed(2), minutesRemainder:mins, hoursInt:Math.floor(hrs),
    drainPerHour:+dph.toFixed(4), drainPerCycle:+reg.drainPerCycle.toFixed(3),
    status, barColor, fault, smart,
    sessions:reg.sessions, currentSession:reg.currentSession,
    sessionCount:reg.sessions.length+(reg.isOn?1:0),
    totalOnSeconds:Math.floor(totalOn), farmerName:reg.farmerName,
    irrigation:reg.irrigation, soilMoisture:reg.soilMoisture,
    temperature:reg.temperature, humidity:reg.humidity, stress:reg.stress,
    elapsedSeconds:Math.floor(elapsed),
    activeProcessIds:reg.activeProcessIds, strategyId:reg.strategyId,
    multiProcessResult:reg.multiProcessResult, replacementDate:rep,
  };
}

function getHandoverSummary(nodeId) {
  const reg = nodeRegistry[nodeId];
  if(!reg||reg.sessions.length===0) return null;
  const last = reg.sessions[reg.sessions.length-1];
  const used = reg.sessions.reduce((s,x)=>s+(x.batteryConsumed||0),0);
  const onMin= Math.floor(reg.totalOnSeconds/60);
  return { nodeId, lastSession:last, totalSessions:reg.sessions.length,
    totalOnMinutes:onMin, totalBatteryUsed:+used.toFixed(2),
    currentBattery:reg.currentBattery,
    handoverMessage:`${nodeId}: Battery ${reg.currentBattery.toFixed(1)}%. ${reg.sessions.length} session(s). ON: ${Math.floor(onMin/60)}h ${onMin%60}m.` };
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function getFaultRisk(bat, hrs, drain) {
  if(hrs<6||(bat<15&&drain>8))return{faultLevel:"FAULT_IMMINENT",faultMessage:`⛔ Offline in ~${Math.floor(hrs)}h ${Math.floor((hrs%1)*60)}m`,faultAction:"Replace battery NOW."};
  if(hrs<24)return{faultLevel:"FAULT_RISK",faultMessage:"⚠️ Battery dies within 24h",faultAction:"Schedule replacement today."};
  if(drain>8)return{faultLevel:"ABNORMAL_DRAIN",faultMessage:`🔍 Abnormal drain: ${drain}%/cycle`,faultAction:"Inspect sensor wiring."};
  return{faultLevel:"NORMAL",faultMessage:"✅ Operating normally",faultAction:""};
}

function getSmartPriority(soil, bat, irr, stress) {
  let p=500, u="LOW";
  if(soil<20||irr==="HIGH"){p=1000;u="HIGH";}
  else if(soil<50||irr==="MEDIUM"){p=700;u="MEDIUM";}
  else{p=300;u="LOW";}
  if(stress>170)p=Math.max(p,900);
  if(bat<15)u="CRITICAL";
  const f=u==="CRITICAL"?"Every 60 min":u==="HIGH"?"Every 5 min":u==="MEDIUM"?"Every 15 min":"Every 30 min";
  return{priority:p,urgency:u,freqLabel:f};
}

function getAdaptiveInterval(bat, irr) {
  const h=irr==="HIGH";
  if(bat>75)return{intervalMinutes:10,mode:"NORMAL",savingVsDefault:0};
  if(bat>30)return{intervalMinutes:h?10:15,mode:"MEDIUM",savingVsDefault:h?0:33};
  if(bat>15)return{intervalMinutes:h?15:30,mode:"LOW_BATTERY",savingVsDefault:h?33:67};
  return{intervalMinutes:60,mode:"CRITICAL",savingVsDefault:83};
}

function estimateBatteryLife(bat, pbat, mode="DEFAULT", interval=DEFAULT_INTERVAL_MINUTES, soil=50, stress=120) {
  bat=Math.max(0,Math.min(100,+bat)); pbat=Math.max(0,Math.min(100,+pbat));
  const ad=bat-pbat, drain=ad>0?ad:(DRAIN_BY_MODE[mode]||DRAIN_BY_MODE.DEFAULT);
  const dph=drain*(60/interval), hrs=dph>0?bat/dph:9999, days=hrs/24, mins=Math.floor((hrs%1)*60);
  let status,barColor,alertMessage;
  if(bat<=15||hrs<2){status="CRITICAL";barColor="#C62828";alertMessage=`Critical! ~${Math.floor(hrs)}h ${mins}m left.`;}
  else if(bat<=30||hrs<6){status="LOW";barColor="#E65100";alertMessage=`Low. Replace in ${Math.floor(days)} day(s).`;}
  else if(bat<=50||hrs<12){status="MEDIUM";barColor="#0277BD";alertMessage=`Medium. ~${Math.floor(days)} day(s).`;}
  else if(bat<=75){status="GOOD";barColor="#2E7D32";alertMessage=`Good. ~${Math.floor(days)} day(s).`;}
  else{status="EXCELLENT";barColor="#1B5E20";alertMessage=`Excellent. ~${Math.floor(days)} day(s).`;}
  let rep=days<1?"Replace TODAY":days<3?`In ${Math.floor(days)+1} days`:days<7?`In ${Math.floor(days)} days`:days<30?`In ~${Math.floor(days/7)} wk(s)`:`In ~${Math.floor(days/30)} mo(s)`;
  return{ hoursRemaining:+hrs.toFixed(1), daysRemaining:+days.toFixed(1), minutesRemainder:mins, hoursInt:Math.floor(hrs),
    drainPerHour:+dph.toFixed(2), drainPerCycle:+drain.toFixed(2), status, barColor, alertMessage,
    hindiMessage:status==="CRITICAL"?"बैटरी तुरंत बदलें।":`बैटरी ${Math.floor(days)} दिन बाकी।`,
    readingsLeft:drain>0?Math.floor(bat/drain):9999, replacementDate:rep,
    lifetimeDaysFrom100:+(100/(dph*24)).toFixed(1),
    adaptive:getAdaptiveInterval(bat,mode),
    smart:getSmartPriority(soil,bat,mode,stress),
    fault:getFaultRisk(bat,hrs,drain) };
}

function getDrainRates(dc, interval=DEFAULT_INTERVAL_MINUTES) {
  const dph=dc*(60/interval);
  return{drainPerCycle:+dc.toFixed(3),drainPerHour:+dph.toFixed(4),
    drainPerMinute:+(dph/60).toFixed(6),drainPerSecond:+(dph/3600).toFixed(8),
    drainPerDay:+(dph*24).toFixed(2),readingsPerHour:+(60/interval).toFixed(2)};
}

function getBatteryChartData(bat, mode="DEFAULT", interval=DEFAULT_INTERVAL_MINUTES) {
  const drain=DRAIN_BY_MODE[mode]||DRAIN_BY_MODE.DEFAULT, dph=drain*(60/interval);
  if(dph<=0)return{hours:[],levels:[],timestamps:[]};
  const total=bat/dph,step=total/20,hours=[],levels=[],timestamps=[],now=new Date();
  for(let i=0;i<=20;i++){
    const h=+(i*step).toFixed(2);
    hours.push(h); levels.push(+Math.max(0,bat-dph*h).toFixed(2));
    timestamps.push(new Date(now.getTime()+h*3600000).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
  }
  return{hours,levels,timestamps};
}

window.BatteryPredictor = {
  // Multi-process
  calculateMultiProcessDrain,
  PROCESS_CATALOG,
  OPTIMIZATION_STRATEGIES,
  // Node ON/OFF + sessions
  initNode, turnNodeOn, turnNodeOff, setNodeProcesses, getLiveNodeState, getHandoverSummary,
  nodeRegistry,
  // Helpers
  estimateBatteryLife, getBatteryChartData, getDrainRates,
  getAdaptiveInterval, getSmartPriority, getFaultRisk,
  // Constants
  DRAIN_BY_MODE, BATTERY_THRESHOLDS, DEFAULT_INTERVAL_MINUTES,
};

export default window.BatteryPredictor;
