import React from 'react';
import { 
  TrendingUp, 
  ArrowRight, 
  Cpu, 
  Sliders,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import DemandForecastChart from './DemandForecastChart';

export default function DemandForecastView({ onSelectCatalogItem, setActiveView }) {
  const featureWeights = [
    { name: 'Prior Day Sales (lag_1)', weight: 34, desc: 'Primary autoregressive persistence signal' },
    { name: '7-Day Moving Baseline (roll_7)', weight: 27, desc: 'Smoothed medium-term momentum filter' },
    { name: 'Price & Competitor Delta', weight: 18, desc: 'Relative cross-elasticity pressure' },
    { name: 'Promotional Discount Rate', weight: 12, desc: 'Promotional elasticity multiplier' },
    { name: 'Calendar Seasonality & Weather', weight: 9, desc: 'Day-of-week and precipitation effects' },
  ];

  return (
    <div className="section-container" role="tabpanel">
      {/* Sleek Page Header */}
      <div className="card-header-bar" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.25rem' }}>
            <TrendingUp className="card-icon" size={20} color="var(--cyan, #06b6d4)" />
            Demand Forecasting Engine
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            XGBoost v1.0 multi-step regression modeling historical sales, pricing elasticity, and seasonal demand drivers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="tag-badge success">
            <CheckCircle2 size={12} />
            Model Status: Active
          </span>
          <span className="tag-badge info">
            XGBoost v1.0
          </span>
        </div>
      </div>

      {/* Main Demand Forecast Chart (showHeader={false} to avoid duplicate title) */}
      <DemandForecastChart onSelectSkuForStudio={onSelectCatalogItem} showHeader={false} />

      {/* Feature Drivers & Optimization Hand-off Grid */}
      <div className="workspace-grid" style={{ marginTop: '24px' }}>
        {/* Left: Key Predictor Weights */}
        <div className="pro-card">
          <div className="card-header-bar">
            <h3 className="card-title" style={{ fontSize: '0.92rem' }}>
              <Cpu className="card-icon" size={17} color="var(--brand-primary)" />
              Top Demand Feature Drivers
            </h3>
            <span className="field-hint">Feature Importance</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Relative contribution of feature groups ingested by the production demand model:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {featureWeights.map((feat) => (
              <div key={feat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.78rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{feat.name}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                      {feat.desc}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-accent)' }}>
                    {feat.weight}%
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${feat.weight * 2.5}%`, 
                      height: '100%', 
                      background: 'var(--brand-primary)',
                      borderRadius: '9999px'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Downstream Inventory Hand-off */}
        <div className="pro-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header-bar">
              <h3 className="card-title" style={{ fontSize: '0.92rem' }}>
                <Sliders className="card-icon" size={17} color="var(--success)" />
                Downstream Inventory Hand-off
              </h3>
              <span className="tag-badge success">Next Stage</span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Forecasted demand from this model is passed directly to the <strong>SciPy / OR-Tools inventory optimization solver</strong> to determine replenishment quantities while respecting warehouse storage ceilings:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="tag-badge info" style={{ padding: '2px 6px' }}>Step 1</span>
                <span><strong>Demand Forecast:</strong> Predicts customer purchasing rate across horizon.</span>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="tag-badge info" style={{ padding: '2px 6px' }}>Step 2</span>
                <span><strong>Safety Buffer:</strong> Protects against demand spikes and lead-time delays.</span>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="tag-badge info" style={{ padding: '2px 6px' }}>Step 3</span>
                <span><strong>Order Decision:</strong> Minimizes holding cost &amp; prevents stockouts.</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="submit-btn"
            style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => setActiveView('studio')}
          >
            <span>Proceed to Optimization Studio</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
