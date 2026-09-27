import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Layers, 
  Columns3, 
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeView, setActiveView }) {
  // Navigation structure
  const navGroups = [
    {
      label: null, // Executive Overview at root
      items: [
        { id: 'overview', label: 'Executive Overview', icon: BarChart3 }
      ]
    },
    {
      label: 'FORECASTING',
      items: [
        { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp }
      ]
    },
    {
      label: 'INVENTORY',
      items: [
        { id: 'catalog', label: 'SKU Inventory Matrix', icon: Package },
        { id: 'studio', label: 'Optimization Studio', icon: Layers }
      ]
    },
    {
      label: 'SIMULATION',
      items: [
        { id: 'simulation', label: 'What-If Simulation', icon: Columns3 }
      ]
    },
  ];

  return (
    <aside className="app-sidebar" aria-label="Main Navigation Sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand-icon" aria-hidden="true">
          <Sparkles size={18} />
        </div>
        <div>
          <div className="sidebar-brand-title">StockFlow AI</div>
          <div className="sidebar-brand-sub">Demand &amp; Inventory</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '12px' }}>
            {group.label && (
              <div 
                style={{ 
                  fontSize: '0.68rem', 
                  fontWeight: 700, 
                  color: 'var(--text-sidebar)', 
                  letterSpacing: '0.06em', 
                  padding: '6px 12px 4px',
                  textTransform: 'uppercase',
                  opacity: 0.75
                }}
              >
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
