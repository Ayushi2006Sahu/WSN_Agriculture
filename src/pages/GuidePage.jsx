import { useState } from 'react';

const GUIDE_ITEMS = [
  { icon:"🌱", title:"What is Soil Moisture?", body:"Soil moisture is the water content in the soil measured as a percentage. 0% = completely dry, 100% = fully saturated. Most crops grow best at 40–70% moisture.", voiceEn:"Soil moisture shows the water content in your soil as a percentage. Zero percent means completely dry and 100 percent means fully saturated. Most crops need 40 to 70 percent moisture.", voiceHi:"मिट्टी की नमी मिट्टी में पानी की मात्रा को प्रतिशत में दर्शाती है। शून्य प्रतिशत मतलब पूरी सूखी और 100 प्रतिशत मतलब पूरी भीगी। अधिकतर फसलों के लिए 40 से 70 प्रतिशत नमी सही है।" },
  { icon:"🌡️", title:"Effect of Temperature", body:"25–32°C is optimal for most crops. Above 35°C, plants need shade nets and more frequent irrigation to prevent heat stress.", voiceEn:"25 to 32 degrees Celsius is optimal for most crops. Above 35 degrees, use shade nets and increase irrigation to prevent heat stress.", voiceHi:"25 से 32 डिग्री सेल्सियस अधिकतर फसलों के लिए सही है। 35 डिग्री से ऊपर होने पर शेड नेट लगाएं और ज़्यादा पानी दें।" },
  { icon:"💧", title:"When is HIGH Irrigation Needed?", body:"Irrigate on HIGH when soil moisture drops below 20% or the stress index exceeds 170. Run irrigation for 30–40 minutes immediately.", voiceEn:"Use high irrigation when soil moisture is below 20 percent or stress index exceeds 170. Irrigate for 30 to 40 minutes immediately.", voiceHi:"जब मिट्टी की नमी 20 प्रतिशत से कम हो या तनाव 170 से ऊपर हो तो HIGH सिंचाई करें। तुरंत 30 से 40 मिनट पानी दें।" },
  { icon:"🔋", title:"When to Replace Sensor Battery?", body:"Replace the battery when it drops below 20% — the dashboard shows CRITICAL status. Always keep 1–2 spare batteries at your farm.", voiceEn:"Replace the sensor battery when it drops below 20 percent. The dashboard will show critical status. Always keep spare batteries at your farm.", voiceHi:"जब बैटरी 20 प्रतिशत से नीचे आ जाए — CRITICAL दिखे — तभी बदलें। खेत में हमेशा 1-2 अतिरिक्त बैटरी रखें।" },
  { icon:"📡", title:"Where to Place the Sensor?", body:"Place the sensor in the center of your field, in a shaded area, buried 10–15 cm deep in the soil. Check the sensor physically every month.", voiceEn:"Place the sensor in the center of your field in a shaded area, 10 to 15 centimeters deep in the soil. Inspect it physically every month.", voiceHi:"सेंसर को खेत के बीच में, छाया में, 10 से 15 सेमी मिट्टी में दबाकर लगाएं। हर महीने एक बार जांच करें।" },
  { icon:"☀️", title:"Solar Charging for Sensors", body:"A small 10W solar panel can keep your sensor node running continuously — no more battery replacements needed.", voiceEn:"A 10 watt solar panel can power your sensor node continuously, eliminating the need for battery replacements.", voiceHi:"10 वाट का सोलर पैनल सेंसर को हमेशा चालू रख सकता है — बैटरी बदलने की ज़रूरत नहीं रहेगी।" },
  { icon:"🌧️", title:"Sensor Readings During Rain", body:"During rain, soil moisture rises automatically — the system shifts from HIGH to LOW irrigation. Check the sensor again 2–3 hours after rain stops.", voiceEn:"During rain, soil moisture rises and the system shifts to low irrigation automatically. Check readings 2 to 3 hours after rain stops.", voiceHi:"बारिश होने पर मिट्टी की नमी बढ़ती है और सिस्टम अपने आप LOW सिंचाई पर आ जाता है। बारिश रुकने के 2-3 घंटे बाद जांच करें।" },
  { icon:"📱", title:"How to Read the Dashboard?", body:"Green = Good condition. Orange = Caution needed. Red = Urgent action required. Click the 🔊 Speak button on any result to hear it in English and Hindi.", voiceEn:"Green means good condition. Orange means caution needed. Red means urgent action required. Press the speak button to hear results in English and Hindi.", voiceHi:"हरा रंग = सब ठीक है। नारंगी = ध्यान दें। लाल = तुरंत कार्रवाई करें। 🔊 बटन दबाएं — हिंदी और अंग्रेजी में सुनें।" },
];

const HELPLINES = [
  { name:"Kisan Call Centre",    number:"1800-180-1551", note:"Free, 24×7, all crop queries" },
  { name:"Agriculture Ministry", number:"1800-11-8585",  note:"Sowing & irrigation help"     },
  { name:"Weather SMS Service",  number:"7733022280",    note:"SMS weather forecasts"         },
];

const QUICK_REF = [
  { irr:"LOW",    soil:"> 50%",  stress:"< 120",   action:"No action needed. Monitor in 6h.",      color:"#2E7D32" },
  { irr:"MEDIUM", soil:"20–50%", stress:"120–170",  action:"Irrigate within 4–6 hours.",            color:"#E65100" },
  { irr:"HIGH",   soil:"< 20%",  stress:"> 170",   action:"Irrigate IMMEDIATELY for 30–40 min.",   color:"#C62828" },
  { irr:"MIN",    soil:"Any",    stress:"Any",      action:"Battery < 20%. Replace sensor battery.", color:"#0277BD" },
];

export default function GuidePage() {
  const [readingAll, setReadingAll] = useState(false);
  const VA = window.VoiceAssistant;

  const speakAll = () => {
    if (readingAll) { VA?.cancel(); setReadingAll(false); return; }
    setReadingAll(true);
    GUIDE_ITEMS.forEach((item, i) => {
      setTimeout(() => {
        VA?.speakBilingual(item.voiceEn, item.voiceHi);
        if (i === GUIDE_ITEMS.length - 1) setReadingAll(false);
      }, i * 8000);
    });
  };

  return (
    <main className="page">
      <div className="page__header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <div className="page__label">Village Farmer Support</div>
          <h2 className="page__title">Farmer's Guide</h2>
          <p className="page__sub">Complete WSN sensor usage guide. Voice assistant reads every tip in English + Hindi.</p>
        </div>
        <button className={`btn btn--voice ${readingAll ? "anim-voice-active" : ""}`} onClick={speakAll}>
          {readingAll ? "⏹ Stop Reading" : "🔊 Read Full Guide"}
        </button>
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        {GUIDE_ITEMS.map((item, i) => (
          <div key={i} className="card card--interactive hover-lift" onClick={() => VA?.speakBilingual(item.voiceEn, item.voiceHi)} role="button" tabIndex={0} onKeyDown={e => e.key==="Enter" && VA?.speakBilingual(item.voiceEn, item.voiceHi)}>
            <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ width:48, height:48, borderRadius:12, background:"#F5F0E8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <h4 style={{ color:"#2E7D32", marginBottom:5 }}>{item.title}</h4>
                <p style={{ fontSize:".83rem", color:"#555", lineHeight:1.65 }}>{item.body}</p>
                <div style={{ fontSize:".7rem", color:"#bbb", marginTop:7 }}>🔊 Click to hear in English + Hindi</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom:24 }}>
        <div className="card__label" style={{ marginBottom:14 }}>Quick Irrigation Reference</div>
        <div className="overflow-x">
          <table className="data-table">
            <thead><tr><th>Irrigation</th><th>Soil Moisture</th><th>Stress Index</th><th>Recommended Action</th></tr></thead>
            <tbody>
              {QUICK_REF.map(row => (
                <tr key={row.irr}>
                  <td><span className={`irr-badge irr-badge--${row.irr}`} style={{ fontSize:".75rem", padding:"3px 12px" }}>{row.irr}</span></td>
                  <td style={{ fontWeight:600 }}>{row.soil}</td>
                  <td style={{ fontWeight:600 }}>{row.stress}</td>
                  <td style={{ color:row.color, fontWeight:700 }}>{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ background:"linear-gradient(135deg,#E8F5E9,#F9FBE7)", border:"2px solid #A5D6A7", marginBottom:24 }}>
        <div style={{ fontWeight:800, fontSize:"1.05rem", color:"#1B5E20", marginBottom:16 }}>📞 Farmer Helplines — Free Support</div>
        <div className="grid-3">
          {HELPLINES.map((h, i) => (
            <div key={i} style={{ background:"white", borderRadius:12, padding:"14px 16px", border:"1px solid #C8E6C9" }}>
              <div style={{ fontWeight:700, fontSize:".9rem", color:"#1B5E20" }}>{h.name}</div>
              <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.3rem", color:"#2E7D32", margin:"4px 0" }}>{h.number}</div>
              <div style={{ fontSize:".73rem", color:"#888" }}>{h.note}</div>
              <button className="btn btn--outline btn--sm" style={{ marginTop:10 }} onClick={() => VA?.speak(`${h.name} helpline number is ${h.number}. ${h.note}.`)}>🔊 Speak Number</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card card--flat" style={{ background:"#F5F0E8", border:"1.5px dashed #C4956A" }}>
        <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
          <span style={{ fontSize:"2rem" }}>🔊</span>
          <div>
            <h4 style={{ color:"#6D4C41", marginBottom:5 }}>Voice Assistant — English + Hindi</h4>
            <p style={{ fontSize:".83rem", color:"#7B5B3A", lineHeight:1.7 }}>
              This dashboard features a bilingual voice assistant. Every prediction result, battery status, and farmer tip can be heard aloud in <strong>English</strong> followed immediately by <strong>Hindi</strong>. Click any <strong>🔊 Speak</strong> button or tap any guide card to activate. Uses your device's built-in Text-to-Speech engine — no internet required.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
