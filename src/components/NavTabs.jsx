const NAV_ITEMS = [
  { id: "predict",   icon: "⚡", label: "Predict",     sub: "Irrigation AI"  },
  { id: "battery",   icon: "🔋", label: "Battery",      sub: "Node Control"   },
  { id: "dashboard", icon: "📈", label: "Dashboard",    sub: "Analytics"      },
  { id: "guide",     icon: "📖", label: "Farmer Guide", sub: "Village Help"   },
];

export default function NavTabs({ activePage, onNavigate }) {
  return (
    <nav className="nav-tabs" role="tablist" aria-label="Main navigation">
      {NAV_ITEMS.map(item => (
        <div key={item.id}
          className={`nav-tab${activePage === item.id ? " active" : ""}`}
          role="tab" aria-selected={activePage === item.id}
          tabIndex={0} onClick={() => onNavigate(item.id)}
          onKeyDown={e => e.key === "Enter" && onNavigate(item.id)}>
          <span className="nav-tab__icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
          <span className="nav-tab__sub">/ {item.sub}</span>
        </div>
      ))}
    </nav>
  );
}
