/**
 * logic/tipsEngine.js
 * ===================
 * Generates personalized farming best-practice tips based on
 * prediction results and live sensor readings.
 * Each tip includes English text + Hindi voice text.
 */

/**
 * Generate up to 5 farming tips based on prediction + sensor values.
 * @param {object} prediction   - Result from MLPredictor.predict()
 * @param {object} sensorValues - { soilMoisture, temperature, humidity, battery, predBattery, stress }
 * @returns {Array<{ icon, title, body, voiceEn, voiceHi, bgColor }>}
 */
function generateTips(prediction, sensorValues) {
  const { irrigation } = prediction;
  const { soilMoisture, temperature, humidity, battery, predBattery, stress } = sensorValues;
  const tips = [];

  // ── Irrigation-specific tips ───────────────────────────────────────────
  if (irrigation === "HIGH") {
    tips.push({
      icon:    "💧",
      bgColor: "#E3F2FD",
      title:   "Irrigate Immediately",
      body:    `Soil is critically dry at ${soilMoisture}%. Start your pump or drip system now. Run for 30–40 minutes.`,
      voiceEn: `Soil moisture is only ${soilMoisture} percent. Start irrigation immediately for 30 to 40 minutes.`,
      voiceHi: `मिट्टी की नमी केवल ${soilMoisture} प्रतिशत है। तुरंत पंप चालू करें और 30 से 40 मिनट तक पानी दें।`,
    });
    tips.push({
      icon:    "⏰",
      bgColor: "#FFF3E0",
      title:   "Best Time to Irrigate",
      body:    `Temperature is ${temperature}°C. Irrigate between 5–7 AM or 6–8 PM to cut evaporation loss by 25%.`,
      voiceEn: `Temperature is ${temperature} degrees. Irrigate in early morning or evening to save water.`,
      voiceHi: `तापमान ${temperature} डिग्री है। पानी की बचत के लिए सुबह 5 से 7 बजे या शाम को सिंचाई करें।`,
    });
    tips.push({
      icon:    "🌱",
      bgColor: "#E8F5E9",
      title:   "Water at Root Level",
      body:    "Pour water directly at the base of plants — not on leaves. Root watering improves absorption by 40%.",
      voiceEn: "Water plants at their roots, not on leaves. This improves absorption significantly.",
      voiceHi: "पानी पत्तियों पर नहीं, पौधों की जड़ों में डालें। इससे पानी जल्दी जज़्ब होता है।",
    });
  } else if (irrigation === "MEDIUM") {
    tips.push({
      icon:    "💦",
      bgColor: "#E3F2FD",
      title:   "Schedule Irrigation Soon",
      body:    `Soil moisture at ${soilMoisture}% is dropping. Irrigate within 4–6 hours to prevent crop stress.`,
      voiceEn: `Soil moisture is ${soilMoisture} percent. Irrigate within 4 to 6 hours.`,
      voiceHi: `मिट्टी की नमी ${soilMoisture} प्रतिशत है। 4 से 6 घंटे में सिंचाई करें।`,
    });
    tips.push({
      icon:    "🌿",
      bgColor: "#F3E5F5",
      title:   "Apply Mulching",
      body:    "Spread dry straw or grass around plant bases (5 cm thick) to slow moisture evaporation.",
      voiceEn: "Spread dry straw around your plants to keep soil moist longer.",
      voiceHi: "पौधों के आसपास सूखी घास बिछाएं — मिट्टी की नमी लंबे समय तक बनी रहेगी।",
    });
    if (stress > 120) {
      tips.push({
        icon:    "📊",
        bgColor: "#FFF8E1",
        title:   "High Stress Detected",
        body:    `Stress index is ${stress} (healthy threshold < 120). Increase water by 20% and consider organic fertilizer.`,
        voiceEn: `Crop stress is ${stress}. Increase water by 20 percent and add fertilizer.`,
        voiceHi: `पौधों का तनाव ${stress} है। पानी 20 प्रतिशत बढ़ाएं और खाद डालें।`,
      });
    }
  } else if (irrigation === "LOW") {
    tips.push({
      icon:    "✅",
      bgColor: "#E8F5E9",
      title:   "Soil Moisture is Optimal",
      body:    `${soilMoisture}% soil moisture is ideal. No immediate irrigation needed — next watering in 12–24 hours.`,
      voiceEn: `Soil moisture is ${soilMoisture} percent. Conditions are good. Next watering in 12 to 24 hours.`,
      voiceHi: `मिट्टी की नमी ${soilMoisture} प्रतिशत है — बिल्कुल सही। अगली सिंचाई 12 से 24 घंटे बाद करें।`,
    });
    tips.push({
      icon:    "🌾",
      bgColor: "#FFF8E1",
      title:   "Good Time for Fertilizer",
      body:    "Moist soil absorbs fertilizer efficiently. Apply urea, DAP, or compost now for best results.",
      voiceEn: "Soil is moist — great time to apply fertilizer for better crop growth.",
      voiceHi: "मिट्टी में नमी है — अभी यूरिया या जैविक खाद डालें। फसल अच्छी होगी।",
    });
    tips.push({
      icon:    "📅",
      bgColor: "#E3F2FD",
      title:   "Schedule Next Check",
      body:    "Check sensor readings again in 6 hours. Monitor earlier if temperature rises above 35°C.",
      voiceEn: "Check your sensor again in 6 hours. Monitor sooner if temperature rises.",
      voiceHi: "6 घंटे बाद सेंसर की जांच करें। अगर गर्मी बढ़े तो पहले देखें।",
    });
  } else {
    // MIN — battery critical
    tips.push({
      icon:    "🔋",
      bgColor: "#FFEBEE",
      title:   "Replace Battery Urgently",
      body:    `Battery at ${battery}%. Sensor will go offline soon. Replace battery within 2 hours.`,
      voiceEn: `Battery is only ${battery} percent. Replace it within 2 hours before the sensor goes offline.`,
      voiceHi: `बैटरी केवल ${battery} प्रतिशत है। 2 घंटे में बैटरी बदलें — वरना सेंसर बंद हो जाएगा।`,
    });
    tips.push({
      icon:    "📡",
      bgColor: "#E3F2FD",
      title:   "Reduce Polling Frequency",
      body:    "To extend battery life, switch sensor reading interval from 10 min to 30 min until replacement.",
      voiceEn: "Change sensor reading interval to 30 minutes to save remaining battery.",
      voiceHi: "बैटरी बचाने के लिए सेंसर को हर 30 मिनट में रीडिंग लेने पर सेट करें।",
    });
    tips.push({
      icon:    "☀️",
      bgColor: "#FFF8E1",
      title:   "Consider Solar Charging",
      body:    "A small 10W solar panel can power sensor nodes continuously — no more battery replacements.",
      voiceEn: "A 10 watt solar panel can keep your sensor running without battery replacements.",
      voiceHi: "10 वाट का सोलर पैनल लगाएं — सेंसर हमेशा चालू रहेगा, बैटरी बदलने की ज़रूरत नहीं।",
    });
  }

  // ── Universal tips based on sensor readings ────────────────────────────
  if (battery < 50 && irrigation !== "MIN") {
    tips.push({
      icon:    "⚡",
      bgColor: "#FFF3E0",
      title:   "Monitor Battery Level",
      body:    `Battery at ${battery}%. Plan replacement ${battery < 25 ? "within 24 hours" : "within 3–5 days"}.`,
      voiceEn: `Battery is ${battery} percent. Plan replacement ${battery < 25 ? "today" : "within a few days"}.`,
      voiceHi: `बैटरी ${battery} प्रतिशत है। ${battery < 25 ? "आज ही" : "3 से 5 दिन में"} बदलने की योजना बनाएं।`,
    });
  }

  if (humidity < 40) {
    tips.push({
      icon:    "🌫️",
      bgColor: "#E8F5E9",
      title:   "Low Ambient Humidity",
      body:    `Humidity at ${humidity}% is very low. Use drip irrigation or misting to raise local crop humidity.`,
      voiceEn: `Humidity is only ${humidity} percent. Use drip irrigation to help crops.`,
      voiceHi: `नमी ${humidity} प्रतिशत है — बहुत कम। ड्रिप सिंचाई से पौधों के आसपास नमी बढ़ाएं।`,
    });
  }

  if (temperature > 35) {
    tips.push({
      icon:    "☀️",
      bgColor: "#FFEBEE",
      title:   "High Temperature Alert",
      body:    `${temperature}°C is above safe limit. Add shade nets and irrigate in cooler hours to protect crops.`,
      voiceEn: `Temperature is ${temperature} degrees — very hot. Add shade nets and irrigate in cooler hours.`,
      voiceHi: `तापमान ${temperature} डिग्री है — बहुत अधिक। शेड नेट लगाएं और सुबह-शाम सिंचाई करें।`,
    });
  }

  return tips.slice(0, 5);
}

// Export as window global
window.TipsEngine = { generateTips };

export default window.TipsEngine;
