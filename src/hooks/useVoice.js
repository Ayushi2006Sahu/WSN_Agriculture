/**
 * hooks/useVoice.js
 * =================
 * Voice assistant hook for the WSN Farm Dashboard.
 * Supports bilingual speech: Hindi (hi-IN) + English (en-IN).
 *
 * Usage (in React components):
 *   const { speak, speakBilingual, cancel, speaking } = window.useVoice();
 */

function createVoiceAssistant() {
  const synth = window.speechSynthesis;
  let isSpeaking = false;

  /**
   * Speak a single text string.
   * @param {string} text   - Text to speak
   * @param {string} lang   - BCP-47 language code, default 'en-IN'
   * @param {number} rate   - Speech rate (0.5–2.0), default 0.88
   */
  function speak(text, lang = "en-IN", rate = 0.88) {
    if (!synth) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = lang;
    utt.rate  = rate;
    utt.pitch = 1.05;
    utt.onstart = () => { isSpeaking = true;  };
    utt.onend   = () => { isSpeaking = false; };
    synth.speak(utt);
  }

  /**
   * Speak English first, then Hindi — bilingual alert.
   * @param {string} englishText
   * @param {string} hindiText
   */
  function speakBilingual(englishText, hindiText) {
    if (!synth) return;
    synth.cancel();

    // English utterance
    const engUtt  = new SpeechSynthesisUtterance(englishText);
    engUtt.lang   = "en-IN";
    engUtt.rate   = 0.88;
    engUtt.pitch  = 1.05;

    // Pause utterance (silent gap)
    const pauseUtt = new SpeechSynthesisUtterance(" ");
    pauseUtt.lang  = "en-IN";
    pauseUtt.rate  = 0.1;

    // Hindi utterance
    const hinUtt  = new SpeechSynthesisUtterance(hindiText);
    hinUtt.lang   = "hi-IN";
    hinUtt.rate   = 0.85;
    hinUtt.pitch  = 1.0;

    engUtt.onstart  = () => { isSpeaking = true;  };
    hinUtt.onend    = () => { isSpeaking = false; };

    synth.speak(engUtt);
    synth.speak(pauseUtt);
    synth.speak(hinUtt);
  }

  /**
   * Speak a full prediction result in both languages.
   * @param {object} prediction  - From MLPredictor.predict()
   * @param {object} battery     - From BatteryPredictor.estimateBatteryLife()
   */
  function speakPredictionResult(prediction, battery) {
    const en = `${prediction.adviceEn} Battery life: ${battery.hoursInt} hours and ${battery.minutesRemainder} minutes. Confidence: ${prediction.confidence} percent.`;
    const hi = `${prediction.adviceHi} बैटरी ${battery.hoursInt} घंटे और ${battery.minutesRemainder} मिनट चलेगी।`;
    speakBilingual(en, hi);
  }

  /**
   * Speak battery status in both languages.
   * @param {object} battery - From BatteryPredictor.estimateBatteryLife()
   */
  function speakBatteryStatus(battery) {
    const en = `${battery.alertMessage} Replacement: ${battery.replacementDate}.`;
    const hi = battery.hindiMessage;
    speakBilingual(en, hi);
  }

  /** Cancel all speech */
  function cancel() {
    if (synth) synth.cancel();
    isSpeaking = false;
  }

  /** Check if speech synthesis is supported */
  function isSupported() {
    return !!synth;
  }

  return {
    speak,
    speakBilingual,
    speakPredictionResult,
    speakBatteryStatus,
    cancel,
    isSupported,
    get isSpeaking() { return isSpeaking; },
  };
}

// Singleton instance exposed globally
window.VoiceAssistant = createVoiceAssistant();
