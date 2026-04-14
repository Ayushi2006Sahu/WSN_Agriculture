/**
 * logic/accuracyEngine.js  — FINAL CORRECTED (GPS + SD removed)
 * ==============================================================
 * Measures Single-Task vs Multi-Task prediction accuracy
 * using the WSN dataset.
 *
 * SINGLE TASKING:
 *   Only soil_read + temp_read + hum_read running.
 *   Clean sensor readings — no interference — 98.33% baseline.
 *
 * MULTI TASKING (7 processes, GPS + SD removed):
 *   All 7 processes run simultaneously.
 *   Each adds physical noise to sensor channels:
 *     radio_tx     → soil ±8,  temp ±1,  hum ±2
 *     pump_control → soil ±6,  temp ±0.5,hum ±1
 *     ml_predict   → soil ±0,  temp ±0,  hum ±0  (no sensor noise)
 *     battery_chk  → soil ±0.5,temp ±0.2,hum ±0.3
 *   NO GPS or SD card noise (removed from system)
 *
 * WHY ACCURACY DROPS:
 *   Decision boundaries: soil<20→HIGH, soil<50→MEDIUM, soil≥50→LOW
 *   radio_tx adds ±8 soil noise → soil=49 can shift to 57 (MEDIUM→LOW wrong)
 *   pump_control adds ±6 soil noise → soil=22 can shift to 16 (MEDIUM→HIGH wrong)
 *   Optimizer reduces overlap probability → less noise → accuracy recovers
 *
 * EXPECTED RESULTS:
 *   NONE strategy:       multi accuracy ~80-85%  (big visible drop)
 *   LIGHT strategy:      multi accuracy ~84-88%
 *   MEDIUM strategy:     multi accuracy ~90-93%
 *   AGGRESSIVE strategy: multi accuracy ~94-97%  (close to single)
 */

// ─────────────────────────────────────────────────────────────
//  PER-PROCESS NOISE in REAL SENSOR UNITS
//  (GPS + SD card entries removed)
// ─────────────────────────────────────────────────────────────
const PROCESS_ACCURACY_IMPACT = {
  soil_read: {
    soil:0, temp:0, hum:0, stressOffset:0,
    reason:"Core sensor — no interference",
    affectsAccuracy:false,
  },
  temp_read: {
    soil:0, temp:0, hum:0, stressOffset:0,
    reason:"Core sensor — no interference",
    affectsAccuracy:false,
  },
  hum_read: {
    soil:0, temp:0, hum:0, stressOffset:0,
    reason:"Core sensor — no interference",
    affectsAccuracy:false,
  },
  pump_control: {
    soil:6, temp:0.5, hum:1, stressOffset:4,
    reason:"Pump vibration shakes soil probe (±6 units on soil)",
    affectsAccuracy:true, primaryChannel:"soil",
  },
  radio_tx: {
    soil:8, temp:1, hum:2, stressOffset:6,
    reason:"RF interference on ADC during TX (±8 units — biggest source)",
    affectsAccuracy:true, primaryChannel:"soil",
  },
  battery_chk: {
    soil:0.5, temp:0.2, hum:0.3, stressOffset:0,
    reason:"Negligible — tiny current draw only",
    affectsAccuracy:false,
  },
  ml_predict: {
    soil:0, temp:0, hum:0, stressOffset:5,
    reason:"Stale T-1 cache — no direct sensor noise",
    affectsAccuracy:true, primaryChannel:"stress",
  },
};

// Strategy reduces interference via duty cycling
const STRATEGY_NOISE_REDUCTION = {
  NONE:       1.00,
  LIGHT:      0.75,
  MEDIUM:     0.45,
  AGGRESSIVE: 0.28,
};

const BASE_ACCURACY = 98.33;

// Gaussian noise using CLT approximation
function applyNoise(value, magnitude, min, max) {
  if (!magnitude || magnitude === 0) return value;
  const gaussian = (Math.random() + Math.random() - 1) * magnitude;
  return Math.max(min, Math.min(max, value + gaussian));
}

// ─────────────────────────────────────────────────────────────
//  MAIN — measureAccuracy
//  Runs entire dataset through single-task vs multi-task.
//  Returns full comparison with per-class metrics.
// ─────────────────────────────────────────────────────────────
function measureAccuracy(datasetRows, activeProcessIds, strategyId="NONE") {
  const strategy      = window.BatteryPredictor?.OPTIMIZATION_STRATEGIES?.[strategyId] || { name:strategyId };
  const dutyReduction = STRATEGY_NOISE_REDUCTION[strategyId] ?? 1.0;

  // ── Step 1: Sum per-channel noise from active processes ────
  let totalSoilNoise    = 0;
  let totalTempNoise    = 0;
  let totalHumNoise     = 0;
  let totalStressOffset = 0;
  const processNoiseBreakdown = [];

  activeProcessIds.forEach(pid => {
    const impact = PROCESS_ACCURACY_IMPACT[pid];
    if (!impact) return;

    const effSoil   = impact.soil         * dutyReduction;
    const effTemp   = impact.temp         * dutyReduction;
    const effHum    = impact.hum          * dutyReduction;
    const effStress = impact.stressOffset * dutyReduction;

    totalSoilNoise    += effSoil;
    totalTempNoise    += effTemp;
    totalHumNoise     += effHum;
    totalStressOffset += effStress;

    processNoiseBreakdown.push({
      processId:       pid,
      name:            window.BatteryPredictor?.PROCESS_CATALOG?.[pid]?.name || pid,
      icon:            window.BatteryPredictor?.PROCESS_CATALOG?.[pid]?.icon || "⚙️",
      rawNoise:        impact.soil,
      effectiveNoise:  parseFloat(effSoil.toFixed(2)),
      rawSoilNoise:    impact.soil,
      rawTempNoise:    impact.temp,
      rawHumNoise:     impact.hum,
      effectiveSoil:   parseFloat(effSoil.toFixed(2)),
      effectiveTemp:   parseFloat(effTemp.toFixed(2)),
      effectiveHum:    parseFloat(effHum.toFixed(2)),
      effectiveStress: parseFloat(effStress.toFixed(2)),
      reason:          impact.reason,
      primaryChannel:  impact.primaryChannel || "none",
      affectsAccuracy: impact.affectsAccuracy,
    });
  });

  totalSoilNoise    = parseFloat(totalSoilNoise.toFixed(2));
  totalTempNoise    = parseFloat(totalTempNoise.toFixed(2));
  totalHumNoise     = parseFloat(totalHumNoise.toFixed(2));
  totalStressOffset = parseFloat(totalStressOffset.toFixed(2));
  const totalNoise  = parseFloat((totalSoilNoise + totalTempNoise + totalHumNoise).toFixed(2));

  // ── Step 2: Run dataset rows through single and multi ──────
  const classes = ["HIGH","MEDIUM","LOW","MIN"];
  const results = {
    single:{ correct:0, total:0, perClass:{}, rows:[] },
    multi: { correct:0, total:0, perClass:{}, rows:[] },
  };
  classes.forEach(c => {
    results.single.perClass[c] = { TP:0,FP:0,FN:0,TN:0 };
    results.multi.perClass[c]  = { TP:0,FP:0,FN:0,TN:0 };
  });

  datasetRows.forEach(row => {
    const actual  = row.irr  || row.Irrigation;
    const soil    = row.soil || row.SoilMoisture;
    const temp    = row.temp || row.Temperature;
    const hum     = row.hum  || row.Humidity;
    const bat     = row.bat  || row.Battery     || 80;
    const predBat = row.pbat || row.PredBattery || 75;

    // SINGLE TASK — clean readings, no interference
    const singlePred    = window.MLPredictor.predict(soil, temp, hum, bat, predBat,
      { mode:"single" });
    const singleCorrect = singlePred.irrigation === actual;
    results.single.total++;
    if (singleCorrect) results.single.correct++;

    // MULTI TASK — noisy readings from process interference
    const noisySoil = parseFloat(applyNoise(soil, totalSoilNoise, 0,   100).toFixed(1));
    const noisyTemp = parseFloat(applyNoise(temp, totalTempNoise, 15,   45).toFixed(1));
    const noisyHum  = parseFloat(applyNoise(hum,  totalHumNoise,  0,  100).toFixed(1));

    const multiPred    = window.MLPredictor.predict(noisySoil, noisyTemp, noisyHum, bat, predBat,
      { mode:"multi", activeProcessIds });
    const multiCorrect = multiPred.irrigation === actual;
    results.multi.total++;
    if (multiCorrect) results.multi.correct++;

    // Confusion matrix
    classes.forEach(c => {
      const s = results.single.perClass[c];
      const m = results.multi.perClass[c];
      if      (actual===c && singlePred.irrigation===c) s.TP++;
      else if (actual===c)                               s.FN++;
      else if (singlePred.irrigation===c)                s.FP++;
      else                                               s.TN++;
      if      (actual===c && multiPred.irrigation===c)   m.TP++;
      else if (actual===c)                               m.FN++;
      else if (multiPred.irrigation===c)                 m.FP++;
      else                                               m.TN++;
    });

    results.single.rows.push({
      actual, predicted:singlePred.irrigation,
      correct:singleCorrect, confidence:singlePred.confidence,
      soil, temp, hum,
    });
    results.multi.rows.push({
      actual, predicted:multiPred.irrigation,
      correct:multiCorrect, confidence:multiPred.confidence,
      noisySoil, noisyTemp, noisyHum,
      soilShift:  parseFloat((noisySoil-soil).toFixed(1)),
      tempShift:  parseFloat((noisyTemp-temp).toFixed(1)),
      humShift:   parseFloat((noisyHum-hum).toFixed(1)),
      changed:    singlePred.irrigation !== multiPred.irrigation,
      crossedSoilBoundary:
        (soil>=20&&noisySoil<20)||(soil<20&&noisySoil>=20)||
        (soil>=50&&noisySoil<50)||(soil<50&&noisySoil>=50),
    });
  });

  // ── Step 3: Compute metrics ────────────────────────────────
  function computeMetrics(res) {
    const accuracy = parseFloat(((res.correct/res.total)*100).toFixed(2));
    const pcm = {};
    classes.forEach(c => {
      const {TP,FP,FN,TN} = res.perClass[c];
      const precision = TP+FP>0 ? parseFloat((TP/(TP+FP)*100).toFixed(2)) : 0;
      const recall    = TP+FN>0 ? parseFloat((TP/(TP+FN)*100).toFixed(2)) : 0;
      const f1 = precision+recall>0 ? parseFloat((2*precision*recall/(precision+recall)).toFixed(2)):0;
      pcm[c]={TP,FP,FN,TN,precision,recall,f1};
    });
    const macroP  = parseFloat((classes.reduce((s,c)=>s+pcm[c].precision,0)/classes.length).toFixed(2));
    const macroR  = parseFloat((classes.reduce((s,c)=>s+pcm[c].recall,0)   /classes.length).toFixed(2));
    const macroF1 = parseFloat((classes.reduce((s,c)=>s+pcm[c].f1,0)       /classes.length).toFixed(2));
    return{accuracy,perClassMetrics:pcm,macroP,macroR,macroF1,correct:res.correct,total:res.total};
  }

  const singleMetrics   = computeMetrics(results.single);
  const multiMetrics    = computeMetrics(results.multi);
  const accuracyDrop    = parseFloat((singleMetrics.accuracy - multiMetrics.accuracy).toFixed(2));
  const changedRows     = results.multi.rows.filter(r=>r.changed).length;
  const boundaryCrossed = results.multi.rows.filter(r=>r.crossedSoilBoundary).length;

  return {
    // Core comparison
    singleAccuracy:    singleMetrics.accuracy,
    multiAccuracy:     multiMetrics.accuracy,
    accuracyDrop,
    isCloseEnough:     accuracyDrop <= 1.5,
    closenessPercent:  parseFloat((100-(accuracyDrop/Math.max(singleMetrics.accuracy,0.01)*100)).toFixed(2)),
    // Metrics
    single: singleMetrics,
    multi:  multiMetrics,
    // Noise
    totalNoise, totalSoilNoise, totalTempNoise, totalHumNoise, totalStressOffset,
    processNoiseBreakdown,
    // Strategy
    strategyId, strategyName:strategy.name||strategyId,
    dutyReduction, noiseReductionPct:parseFloat(((1-dutyReduction)*100).toFixed(0)),
    // Dataset
    datasetSize:datasetRows.length, activeProcessCount:activeProcessIds.length,
    changedRows, changedRowsPct:parseFloat(((changedRows/datasetRows.length)*100).toFixed(1)),
    boundaryCrossed, boundaryCrossedPct:parseFloat(((boundaryCrossed/datasetRows.length)*100).toFixed(1)),
    // Rows
    singleRows:results.single.rows, multiRows:results.multi.rows,
  };
}

// ─────────────────────────────────────────────────────────────
//  Compare all 4 strategies
// ─────────────────────────────────────────────────────────────
function compareStrategies(datasetRows, activeProcessIds) {
  return ["NONE","LIGHT","MEDIUM","AGGRESSIVE"].map(sid => {
    const r = measureAccuracy(datasetRows, activeProcessIds, sid);
    const s = window.BatteryPredictor?.OPTIMIZATION_STRATEGIES?.[sid];
    return {
      strategyId:sid, strategyName:s?.name||sid, icon:s?.icon||"⚙️",
      singleAccuracy:r.singleAccuracy, multiAccuracy:r.multiAccuracy,
      accuracyDrop:r.accuracyDrop, isCloseEnough:r.isCloseEnough,
      totalNoise:r.totalNoise, totalSoilNoise:r.totalSoilNoise,
      totalTempNoise:r.totalTempNoise, totalHumNoise:r.totalHumNoise,
      changedRows:r.changedRows, changedRowsPct:r.changedRowsPct,
      boundaryCrossed:r.boundaryCrossed, noiseReductionPct:r.noiseReductionPct,
    };
  });
}

// ─────────────────────────────────────────────────────────────
//  Process impact — disable one at a time, see accuracy change
// ─────────────────────────────────────────────────────────────
function measureProcessImpact(datasetRows, allProcessIds) {
  const base = measureAccuracy(datasetRows, allProcessIds, "MEDIUM");
  const impacts = [];
  allProcessIds.forEach(pid => {
    const proc   = window.BatteryPredictor?.PROCESS_CATALOG?.[pid];
    const impact = PROCESS_ACCURACY_IMPACT[pid];
    if (!proc || !proc.canSkip) return;
    const without   = allProcessIds.filter(p=>p!==pid);
    const result    = measureAccuracy(datasetRows, without, "MEDIUM");
    const drain     = proc.baseDrain || 0;
    const accGain   = parseFloat((result.multiAccuracy - base.multiAccuracy).toFixed(2));
    const soilRem   = (impact?.soil||0) * (STRATEGY_NOISE_REDUCTION["MEDIUM"]??0.45);
    impacts.push({
      processId:pid, name:proc.name, icon:proc.icon,
      accuracyWithout:result.multiAccuracy, accuracyWith:base.multiAccuracy,
      accuracyGain:accGain, drainSaved:drain,
      soilNoiseRemoved:parseFloat(soilRem.toFixed(2)),
      primaryChannel:impact?.primaryChannel||"—",
      changedRowsBefore:base.changedRows, changedRowsAfter:result.changedRows,
      recommendation:
        accGain>1.0 ? `✅ DISABLE — improves accuracy by +${accGain}% AND saves ${drain}%/cycle`
        :accGain>0.3? `🟡 Optional — moderate gain +${accGain}%, saves ${drain}%/cycle`
        :             `ℹ️ Minimal gain (+${accGain}%), saves ${drain}%/cycle battery`,
    });
  });
  impacts.sort((a,b)=>b.accuracyGain-a.accuracyGain||b.drainSaved-a.drainSaved);
  return { base, impacts };
}

function measureSingleProcessAccuracy(datasetRows) {
  return measureAccuracy(datasetRows, ["soil_read","temp_read","hum_read"], "NONE");
}

window.AccuracyEngine = {
  measureAccuracy,
  compareStrategies,
  measureProcessImpact,
  measureSingleProcessAccuracy,
  applyNoise,
  PROCESS_ACCURACY_IMPACT,
  STRATEGY_NOISE_REDUCTION,
  BASE_ACCURACY,
};

export default window.AccuracyEngine;
