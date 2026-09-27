import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  PRESETS, 
  STORE_OPTIONS, 
  WEATHER_CONDITIONS, 
  SEASONS, 
  REGIONS, 
  CATEGORIES,
  GROCERY_CATALOG
} from '../data/presets';
import { predictDemand } from '../services/api';

export default function PredictSection({ formData, setFormData, onForecastSuccess }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [activePresetId, setActivePresetId] = useState('promo_surge');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyPreset = (preset) => {
    setActivePresetId(preset.id);
    setFormData(prev => ({
      ...prev,
      ...preset.payload
    }));
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      "Store ID": formData["Store ID"],
      "Product ID": formData["Product ID"],
      "Category": formData["Category"],
      "Region": formData["Region"],
      "Price": parseFloat(formData["Price"]),
      "Discount": parseFloat(formData["Discount"]),
      "Weather Condition": formData["Weather Condition"],
      "Promotion": parseInt(formData["Promotion"]),
      "Competitor Pricing": parseFloat(formData["Competitor Pricing"]),
      "Seasonality": formData["Seasonality"],
      "Epidemic": parseInt(formData["Epidemic"]),
      "Date": formData["Date"],
      "Demand_lag_1": parseFloat(formData["Demand_lag_1"]),
      "Demand_lag_7": parseFloat(formData["Demand_lag_7"]),
      "Demand_roll_7": parseFloat(formData["Demand_roll_7"]),
    };

    const res = await predictDemand(payload);
    setLoading(false);

    if (res.success) {
      setResult(res.data);
      if (onForecastSuccess) onForecastSuccess(res.data.predicted_demand);
    } else {
      setError(res.error);
    }
  };

  const rollingDiff = result 
    ? (result.predicted_demand - formData["Demand_roll_7"]).toFixed(1)
    : null;

  return (
    <div className="section-container" role="tabpanel">
      {/* Quick Scenario Selector */}
      <div className="presets-toolbar">
        <span className="presets-label">Preset Scenarios:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            id={`preset-btn-${preset.id}`}
            type="button"
            className={`preset-chip ${activePresetId === preset.id ? 'active' : ''}`}
            onClick={() => applyPreset(preset)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="workspace-grid">
        {/* Input Parameters Form */}
        <div className="pro-card">
          <div className="card-header-bar">
            <h2 className="card-title">
              <TrendingUp className="card-icon" size={18} />
              Forecasting Model Parameters
            </h2>
            <span className="tag-badge info">
              XGBoost Pipeline
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Group 1: Store & SKU Context */}
            <div className="form-fieldset">
              <div className="fieldset-legend">Store &amp; Product Context</div>
              <div className="form-group-grid">
                <div className="form-field">
                  <label className="field-label" htmlFor="predict-store-id">Store ID</label>
                  <select
                    id="predict-store-id"
                    className="pro-select"
                    value={formData["Store ID"]}
                    onChange={(e) => handleInputChange("Store ID", e.target.value)}
                  >
                    {STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="predict-product-id">Catalog SKU &amp; Item</label>
                  <select
                    id="predict-product-id"
                    className="pro-select"
                    value={formData["Product ID"] || "SKU_1"}
                    onChange={(e) => {
                      const selectedSku = e.target.value;
                      const catalogItem = GROCERY_CATALOG.find(i => i.sku === selectedSku);
                      handleInputChange("Product ID", selectedSku);
                      if (catalogItem) {
                        handleInputChange("Category", catalogItem.category);
                        handleInputChange("Price", catalogItem.price);
                        handleInputChange("Competitor Pricing", catalogItem.compPrice);
                      }
                    }}
                  >
                    {GROCERY_CATALOG.map(item => (
                      <option key={item.sku} value={item.sku}>
                        {item.sku} &mdash; {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="predict-category">Category</label>
                  <select
                    id="predict-category"
                    className="pro-select"
                    value={formData["Category"]}
                    onChange={(e) => handleInputChange("Category", e.target.value)}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="predict-region">Region</label>
                  <select
                    id="predict-region"
                    className="pro-select"
                    value={formData["Region"]}
                    onChange={(e) => handleInputChange("Region", e.target.value)}
                  >
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="form-field full-width">
                  <label className="field-label" htmlFor="predict-date">
                    <span>Forecast Date</span>
                    <span className="field-hint">Generates calendar features (day of week, month)</span>
                  </label>
                  <input
                    id="predict-date"
                    type="date"
                    className="pro-input"
                    value={formData["Date"]}
                    onChange={(e) => handleInputChange("Date", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Group 2: Pricing & Market Drivers */}
            <div className="form-fieldset">
              <div className="fieldset-legend">Pricing &amp; Market Factors</div>
              <div className="form-group-grid">
                <div className="form-field">
                  <label className="field-label" htmlFor="predict-price">Retail Price (₹)</label>
                  <input
                    id="predict-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="pro-input"
                    value={formData["Price"]}
                    onChange={(e) => handleInputChange("Price", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="predict-comp-price">Competitor Price (₹)</label>
                  <input
                    id="predict-comp-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="pro-input"
                    value={formData["Competitor Pricing"]}
                    onChange={(e) => handleInputChange("Competitor Pricing", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label className="field-label" htmlFor="predict-discount">Discount Rate</label>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                      {formData["Discount"]}%
                    </span>
                  </div>
                  <input
                    id="predict-discount"
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={formData["Discount"]}
                    onChange={(e) => handleInputChange("Discount", parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Weather Condition</label>
                  <div className="toggle-pills">
                    {WEATHER_CONDITIONS.map((cond) => (
                      <button
                        key={cond}
                        id={`weather-btn-${cond.toLowerCase()}`}
                        type="button"
                        className={`toggle-pill-btn ${formData["Weather Condition"] === cond ? 'active' : ''}`}
                        onClick={() => handleInputChange("Weather Condition", cond)}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="predict-seasonality">Season</label>
                  <select
                    id="predict-seasonality"
                    className="pro-select"
                    value={formData["Seasonality"]}
                    onChange={(e) => handleInputChange("Seasonality", e.target.value)}
                  >
                    {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Promotional Campaign</label>
                  <div className="toggle-pills">
                    <button
                      id="promo-toggle-yes"
                      type="button"
                      className={`toggle-pill-btn ${formData["Promotion"] === 1 ? 'active' : ''}`}
                      onClick={() => handleInputChange("Promotion", 1)}
                    >
                      Active
                    </button>
                    <button
                      id="promo-toggle-no"
                      type="button"
                      className={`toggle-pill-btn ${formData["Promotion"] === 0 ? 'active' : ''}`}
                      onClick={() => handleInputChange("Promotion", 0)}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Group 3: Demand Lags */}
            <div className="form-fieldset" style={{ marginBottom: 0 }}>
              <div className="fieldset-legend">Demand History Signals</div>
              <div className="form-group-grid">
                <div className="form-field">
                  <label className="field-label" htmlFor="predict-lag-1">Demand Lag (1 Day Prior)</label>
                  <input
                    id="predict-lag-1"
                    type="number"
                    step="1"
                    min="0"
                    className="pro-input"
                    value={formData["Demand_lag_1"]}
                    onChange={(e) => handleInputChange("Demand_lag_1", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="predict-lag-7">Demand Lag (7 Days Prior)</label>
                  <input
                    id="predict-lag-7"
                    type="number"
                    step="1"
                    min="0"
                    className="pro-input"
                    value={formData["Demand_lag_7"]}
                    onChange={(e) => handleInputChange("Demand_lag_7", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <label className="field-label" htmlFor="predict-roll-7">
                    <span>7-Day Rolling Average Demand</span>
                    <span className="field-hint">Moving baseline</span>
                  </label>
                  <input
                    id="predict-roll-7"
                    type="number"
                    step="0.1"
                    min="0"
                    className="pro-input"
                    value={formData["Demand_roll_7"]}
                    onChange={(e) => handleInputChange("Demand_roll_7", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              id="btn-run-prediction"
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Running Inference...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Execute Demand Prediction</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Display */}
        <div className="pro-card results-card">
          <div className="card-header-bar">
            <h3 className="card-title">
              <Layers className="card-icon" size={18} />
              Forecast Results
            </h3>
            <span className="field-hint">
              {result ? 'Completed' : 'Awaiting Execution'}
            </span>
          </div>

          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.82rem', display: 'flex', gap: '8px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Inference Failed:</strong> {error}
              </div>
            </div>
          )}

          {result ? (
            <>
              {/* Primary Metric */}
              <div className="exec-metric-card">
                <div className="exec-metric-header">
                  <span className="exec-metric-label">Predicted Demand</span>
                  <span className="tag-badge success">
                    {result.model_name} v{result.model_version}
                  </span>
                </div>
                <div className="exec-metric-val">
                  {result.predicted_demand > 0 ? Math.round(result.predicted_demand) : 0}
                  <span className="exec-metric-unit">Units / Day</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  Continuous output: {result.predicted_demand.toFixed(2)} units
                </div>
              </div>

              {/* Statistical Signals */}
              <div className="decision-cards-grid">
                <div className="metric-pill-card">
                  <span className="metric-pill-title">Delta vs 7D Moving Avg</span>
                  <div className="metric-pill-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {rollingDiff >= 0 ? (
                      <>
                        <ArrowUpRight size={18} color="var(--success)" />
                        <span style={{ color: 'var(--success)' }}>+{rollingDiff}</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight size={18} color="var(--danger)" />
                        <span style={{ color: 'var(--danger)' }}>{rollingDiff}</span>
                      </>
                    )}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    Baseline: {formData["Demand_roll_7"]} units
                  </span>
                </div>

                <div className="metric-pill-card">
                  <span className="metric-pill-title">Price Competitiveness</span>
                  <div className="metric-pill-value">
                    {((formData["Price"] / (formData["Competitor Pricing"] || 1)) * 100).toFixed(0)}%
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    {formData["Price"] <= formData["Competitor Pricing"] ? 'Competitive Advantage' : 'Priced Above Market'}
                  </span>
                </div>
              </div>

              {/* Operational Recommendation */}
              <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} color="var(--brand-primary)" />
                  Operational Recommendation
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {result.predicted_demand > 50 
                    ? 'High item turnover expected. Verify warehouse safety stock levels in the Inventory Optimizer.'
                    : 'Standard demand pace. Maintain standard replenishment cycles to minimize holding overhead.'}
                </p>
              </div>

              {/* Response Inspector Accordion */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setShowJson(!showJson)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  <span>JSON Payload &amp; Response</span>
                  {showJson ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showJson && (
                  <pre style={{ padding: '10px 12px', background: 'var(--bg-input)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', overflowX: 'auto', borderTop: '1px solid var(--border-color)' }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-tertiary)' }}>
              <Clock size={28} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '0.9rem' }}>
                No Active Forecast
              </div>
              <p style={{ fontSize: '0.78rem', maxWidth: '280px', margin: '0 auto' }}>
                Adjust the model parameters and click <strong>Execute Demand Prediction</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
