import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/battery.css'
import './styles/animations.css'

// Init logic globals before React mounts
import './logic/sampleData.js'
import './logic/batteryPredictor.js'
import './logic/mlPredictor.js'
import './logic/tipsEngine.js'
import './logic/accuracyEngine.js'
import './hooks/voiceAssistant.js'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
