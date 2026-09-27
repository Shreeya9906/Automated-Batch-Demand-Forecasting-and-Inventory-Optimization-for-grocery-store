import React from 'react';
import { Search, ExternalLink, Moon, Sun } from 'lucide-react';

export default function TopNav({ activeView, searchQuery, setSearchQuery, theme, setTheme }) {
  const viewTitles = {
    overview: 'Executive Overview & Inventory Health',
    forecast: 'Demand Forecast (XGBoost v1.0)',
    catalog: 'SKU Inventory & Constraint Matrix',
    studio: 'Supply Chain Optimization Studio',
    simulation: 'What-If Scenario Simulation',
    pipeline: 'Automated MLOps Batch Pipeline Status',
    telemetry: 'Evidently AI Drift Monitoring',
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'midnight-navy' ? 'slate-light' : 'midnight-navy';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="top-nav-bar" role="banner">
      <div className="nav-breadcrumb">
        <span>Workspace</span>
        <span>/</span>
        <strong>{viewTitles[activeView] || 'Overview'}</strong>
      </div>

      <div className="top-nav-actions">
        {/* Quick SKU Search */}
        <div className="global-sku-search">
          <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
          <input
            id="global-sku-search"
            type="text"
            placeholder="Search SKU or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Streamlined Dark/Navy Theme Toggle */}
        <button
          type="button"
          className="theme-pill-btn"
          onClick={toggleTheme}
          title="Toggle Dark Navy / Slate Light mode"
          style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
        >
          {theme === 'midnight-navy' ? (
            <>
              <Moon size={13} color="var(--brand-accent)" />
              <span>Midnight Navy</span>
            </>
          ) : (
            <>
              <Sun size={13} color="var(--warning)" />
              <span>Slate Light</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
