import { useState, useEffect } from 'react';

export default function Header({ predictionCount }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-IN"));
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString("en-IN")), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo" aria-hidden="true">🌾</div>
        <div>
          <div className="header__title">WSN Village Farm Dashboard</div>
          <div className="header__sub">Wireless Sensor Network · AI Irrigation System</div>
        </div>
      </div>
      <div className="header__right">
        <div className="header__live" title="System live" aria-label="System live" />
        <span className="header__pill header__pill--green">✅ 98.33% Accuracy</span>
        {predictionCount > 0 && (
          <span className="header__pill header__pill--orange">🧠 {predictionCount} Prediction{predictionCount !== 1 ? "s" : ""}</span>
        )}
        <span className="header__time" aria-label="Current time">{time}</span>
      </div>
    </header>
  );
}
