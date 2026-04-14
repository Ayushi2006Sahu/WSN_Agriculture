/**
 * logic/sampleData.js  — v8
 * Full WSN dataset samples + sensor node definitions
 */

const SAMPLE_DATA = [
  { soil:10, temp:26, hum:63, bat:98, pbat:88, stress:179, status:"CRITICAL", irr:"HIGH"   },
  { soil:60, temp:28, hum:76, bat:98, pbat:98, stress:144, status:"NORMAL",   irr:"LOW"    },
  { soil:29, temp:26, hum:77, bat:97, pbat:92, stress:174, status:"WARNING",  irr:"MEDIUM" },
  { soil:38, temp:27, hum:44, bat:96, pbat:91, stress:133, status:"WARNING",  irr:"MEDIUM" },
  { soil:2,  temp:25, hum:54, bat:95, pbat:90, stress:177, status:"CRITICAL", irr:"HIGH"   },
  { soil:2,  temp:29, hum:76, bat:93, pbat:83, stress:203, status:"CRITICAL", irr:"HIGH"   },
  { soil:49, temp:22, hum:41, bat:91, pbat:81, stress:114, status:"NORMAL",   irr:"LOW"    },
  { soil:49, temp:27, hum:50, bat:91, pbat:91, stress:128, status:"NORMAL",   irr:"LOW"    },
  { soil:82, temp:28, hum:70, bat:90, pbat:85, stress:116, status:"NORMAL",   irr:"LOW"    },
  { soil:46, temp:20, hum:45, bat:89, pbat:84, stress:119, status:"NORMAL",   irr:"LOW"    },
  { soil:70, temp:21, hum:60, bat:89, pbat:89, stress:111, status:"NORMAL",   irr:"LOW"    },
  { soil:52, temp:20, hum:75, bat:87, pbat:77, stress:143, status:"NORMAL",   irr:"LOW"    },
  { soil:38, temp:22, hum:64, bat:85, pbat:75, stress:148, status:"WARNING",  irr:"MEDIUM" },
  { soil:65, temp:34, hum:41, bat:85, pbat:85, stress:110, status:"WARNING",  irr:"MEDIUM" },
  { soil:82, temp:29, hum:49, bat:85, pbat:85, stress:96,  status:"NORMAL",   irr:"LOW"    },
  { soil:97, temp:22, hum:45, bat:83, pbat:73, stress:70,  status:"NORMAL",   irr:"LOW"    },
  { soil:6,  temp:24, hum:78, bat:83, pbat:83, stress:196, status:"CRITICAL", irr:"HIGH"   },
  { soil:62, temp:25, hum:62, bat:83, pbat:83, stress:125, status:"NORMAL",   irr:"LOW"    },
  { soil:15, temp:31, hum:55, bat:80, pbat:70, stress:168, status:"CRITICAL", irr:"HIGH"   },
  { soil:55, temp:29, hum:62, bat:78, pbat:68, stress:130, status:"WARNING",  irr:"MEDIUM" },
  { soil:88, temp:23, hum:71, bat:75, pbat:65, stress:85,  status:"NORMAL",   irr:"LOW"    },
  { soil:30, temp:35, hum:38, bat:72, pbat:62, stress:155, status:"WARNING",  irr:"MEDIUM" },
  { soil:12, temp:28, hum:50, bat:68, pbat:58, stress:182, status:"CRITICAL", irr:"HIGH"   },
  { soil:75, temp:24, hum:67, bat:65, pbat:55, stress:92,  status:"NORMAL",   irr:"LOW"    },
  { soil:40, temp:32, hum:42, bat:60, pbat:50, stress:148, status:"WARNING",  irr:"MEDIUM" },
];

const DATASET_STATS = {
  totalRows:         596,
  testAccuracy:      "98.33%",
  cvAccuracy:        "99.67% ± 0.41%",
  classDistribution: { HIGH:19, LOW:52, MEDIUM:40, MIN:9 },
  bestParams:        { n_estimators:50, max_depth:null, min_samples_split:5 },
};

const CLASSIFICATION_REPORT = [
  { cls:"HIGH",   precision:1.00, recall:1.00, f1:1.00, support:19 },
  { cls:"LOW",    precision:1.00, recall:0.96, f1:0.98, support:52 },
  { cls:"MEDIUM", precision:0.95, recall:1.00, f1:0.97, support:40 },
  { cls:"MIN",    precision:1.00, recall:1.00, f1:1.00, support:9  },
];

const SENSOR_NODES = [
  { nodeId:"Node #1 — North Field", battery:78, predBattery:73, soilMoisture:28, temperature:32, humidity:45, stress:142, irrigation:"MEDIUM", location:"North-east corner · Row 1–5",  cropType:"Wheat"      },
  { nodeId:"Node #2 — South Field", battery:38, predBattery:33, soilMoisture:10, temperature:37, humidity:32, stress:196, irrigation:"HIGH",   location:"South end · Row 15–20",        cropType:"Cotton"     },
  { nodeId:"Node #3 — Center Field",battery:82, predBattery:78, soilMoisture:62, temperature:26, humidity:65, stress:82,  irrigation:"LOW",    location:"Center · Row 8–12",            cropType:"Rice"       },
  { nodeId:"Node #4 — West Field",  battery:16, predBattery:10, soilMoisture:6,  temperature:40, humidity:28, stress:228, irrigation:"HIGH",   location:"West boundary · Row 1–8",      cropType:"Sugarcane"  },
  { nodeId:"Node #5 — East Field",  battery:95, predBattery:91, soilMoisture:75, temperature:24, humidity:72, stress:58,  irrigation:"LOW",    location:"East side · Row 6–14",         cropType:"Vegetables" },
  { nodeId:"Node #6 — Greenhouse",  battery:54, predBattery:49, soilMoisture:40, temperature:30, humidity:56, stress:126, irrigation:"MEDIUM", location:"Greenhouse Block A",           cropType:"Tomatoes"   },
];

window.SampleData = { SAMPLE_DATA, DATASET_STATS, CLASSIFICATION_REPORT, SENSOR_NODES };
 
export default window.SampleData;
