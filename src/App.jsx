import { useState } from 'react';
import Header from './components/Header.jsx';
import NavTabs from './components/NavTabs.jsx';
import PredictPage from './pages/PredictPage.jsx';
import BatteryPage from './pages/BatteryPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import GuidePage from './pages/GuidePage.jsx';

export default function App() {
  const [activePage, setActivePage] = useState("predict");
  const [history,    setHistory]    = useState([]);

  return (
    <div id="app-shell">
      <Header predictionCount={history.length} />
      <NavTabs activePage={activePage} onNavigate={setActivePage} />
      <div id="page-content" role="main">
        {activePage === "predict"   && <PredictPage   history={history} setHistory={setHistory} />}
        {activePage === "battery"   && <BatteryPage   history={history} />}
        {activePage === "dashboard" && <DashboardPage history={history} />}
        {activePage === "guide"     && <GuidePage />}
      </div>
      <footer className="app-footer">
        WSN Village Farm Dashboard · Random Forest 98.33% · React + Vite ·
        Single &amp; Multi-Task Comparison · Voice: English + Hindi 🌾
      </footer>
    </div>
  );
}
