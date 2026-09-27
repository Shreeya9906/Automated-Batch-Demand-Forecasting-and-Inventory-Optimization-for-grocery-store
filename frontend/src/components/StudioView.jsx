import React, { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  DollarSign, 
  ArrowRight, 
  Clock, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { 
  PRESETS, 
  STORE_OPTIONS, 
  WAREHOUSE_OPTIONS, 
  SKU_OPTIONS, 
  WEATHER_CONDITIONS, 
  SEASONS, 
  REGIONS, 
  CATEGORIES,
  GROCERY_CATALOG 
} from '../data/presets';
import { optimizeInventory } from '../services/api';

export default function StudioView({ formData, setFormData }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const handleRunPipeline = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Call unified optimize API (which runs demand prediction + replenishment optimization)
    const payload = {
      "Store ID": formData["Store ID"] || "S001",
      "Product ID": formData["Product ID"] || "P0001",
      "Category": formData["Category"] || "Atta & Grains",
      "Region": formData["Region"] || "North",
      "Price": parseFloat(formData["Price"]) || 4.0,
      "Discount": parseFloat(formData["Discount"]) || 0.0,
      "Weather Condition": formData["Weather Condition"] || "Sunny",
      "Promotion": parseInt(formData["Promotion"]) || 0,
      "Competitor Pricing": parseFloat(formData["Competitor Pricing"]) || 4.5,
      "Seasonality": formData["Seasonality"] || "Winter",
      "Epidemic": parseInt(formData["Epidemic"]) || 0,
      "Date": formData["Date"] || new Date().toISOString().split('T')[0],
      "Demand_lag_1": parseFloat(formData["Demand_lag_1"]) || 100.0,
      "Demand_lag_7": parseFloat(formData["Demand_lag_7"]) || 95.0,
      "Demand_roll_7": parseFloat(formData["Demand_roll_7"]) || 98.0,
      "Warehouse_ID": formData["Warehouse_ID"] || "WH_1",
      "SKU_ID": formData["SKU_ID"] || "SKU_1",
      "Inventory_Level": parseFloat(formData["Inventory_Level"]) ?? 60.0,
      "Reorder_Point": parseFloat(formData["Reorder_Point"]) ?? 100.0,
    };

    const res = await optimizeInventory(payload);
    setLoading(false);

    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
  };

  const safetyStockVal = formData["Safety_Stock"] ?? 30;
  const capacityVal = formData["Warehouse_Capacity"] ?? 500;

  return (
    <div className="section-container">
      {/* Visual Pipeline Banner demonstrating Section 1 & Section 8 Workflow */}
      <div className="flow-pipeline-banner">
        <div className="flow-step-item">
          <div className="flow-step-num">1</div>
          <div className="flow-step-info">
            <h4>Demand Forecast</h4>
            <p>Projected customer demand</p>
          </div>
        </div>

        <ArrowRight size={18} className="flow-arrow-separator" />

        <div className="flow-step-item">
          <div className="flow-step-num">2</div>
          <div className="flow-step-info">
            <h4>Inventory Optimization</h4>
            <p>Warehouse capacity and safety stock</p>
          </div>
        </div>

        <ArrowRight size={18} className="flow-arrow-separator" />

        <div className="flow-step-item">
          <div className="flow-step-num">3</div>
          <div className="flow-step-info">
            <h4>Recommended Order Qty</h4>
            <p>Optimal replenishment units &amp; bounds (Q*)</p>
          </div>
        </div>
      </div>

      {/* Enterprise Baseline Workflow Presets */}
      <div className="presets-container">
        <div className="presets-header">
          <div className="presets-title-wrap">
            <div className="presets-badge-icon">
              <Sparkles size={15} />
            </div>
            <div>
              <div className="presets-title">Baseline Operational Presets</div>
              <div className="presets-subtitle">
                Select an enterprise scenario to automatically load demand drivers, pricing, and warehouse bounds
              </div>
            </div>
          </div>
          <span className="presets-count-pill">{PRESETS.length} Validated Scenarios</span>
        </div>

        <div className="presets-grid">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`studio-preset-${preset.id}`}
                type="button"
                className={`preset-card-btn ${isActive ? 'active' : ''}`}
                onClick={() => applyPreset(preset)}
              >
                <div className="preset-card-top">
                  <span className={`preset-badge badge-${preset.id}`}>
                    {preset.badge}
                  </span>
                  {isActive && (
                    <span className="preset-active-indicator">
                      <CheckCircle2 size={12} /> Loaded
                    </span>
                  )}
                </div>
                <div className="preset-card-name">{preset.name}</div>
                <div className="preset-card-desc">{preset.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="workspace-grid">
        {/* Left Interactive Parameters */}
        <div className="pro-card">
          <div className="card-header-bar">
            <h2 className="card-title">
              <Zap className="card-icon" size={18} />
              Optimization Studio Parameters
            </h2>
            <span className="tag-badge info">Replenishment decision</span>
          </div>

          <form onSubmit={handleRunPipeline}>
            {/* Warehouse & Inventory Parameters */}
            <div className="form-fieldset">
              <div className="fieldset-legend">Fulfillment Node &amp; Inventory Bounds</div>
              <div className="form-group-grid">
                <div className="form-field">
                  <label className="field-label" htmlFor="studio-wh-id">Warehouse Hub</label>
                  <select
                    id="studio-wh-id"
                    className="pro-select"
                    value={formData["Warehouse_ID"] || "WH_1"}
                    onChange={(e) => handleInputChange("Warehouse_ID", e.target.value)}
                  >
                    {WAREHOUSE_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="studio-sku-id">Catalog SKU</label>
                  <select
                    id="studio-sku-id"
                    className="pro-select"
                    value={formData["SKU_ID"] || "SKU_1"}
                    onChange={(e) => {
                      const sku = e.target.value;
                      handleInputChange("SKU_ID", sku);
                      const catItem = GROCERY_CATALOG.find(i => i.sku === sku);
                      if (catItem) {
                        handleInputChange("Product ID", catItem.sku);
                        handleInputChange("Category", catItem.category);
                        handleInputChange("Price", catItem.price);
                        handleInputChange("Competitor Pricing", catItem.compPrice);
                      }
                    }}
                  >
                    {GROCERY_CATALOG.map(item => (
                      <option key={item.sku} value={item.sku}>
                        {item.sku} — {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="studio-inventory">Current Stock (Units)</label>
                  <input
                    id="studio-inventory"
                    type="number"
                    min="0"
                    className="pro-input"
                    value={formData["Inventory_Level"] ?? 60}
                    onChange={(e) => handleInputChange("Inventory_Level", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="studio-rop">Reorder Point (ROP)</label>
                  <input
                    id="studio-rop"
                    type="number"
                    min="0"
                    className="pro-input"
                    value={formData["Reorder_Point"] ?? 100}
                    onChange={(e) => handleInputChange("Reorder_Point", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="studio-safety-stock">Safety Stock Buffer</label>
                  <input
                    id="studio-safety-stock"
                    type="number"
                    min="0"
                    className="pro-input"
                    value={safetyStockVal}
                    onChange={(e) => handleInputChange("Safety_Stock", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="studio-capacity">Warehouse Capacity Limit</label>
                  <input
                    id="studio-capacity"
                    type="number"
                    min="100"
                    className="pro-input"
                    value={capacityVal}
                    onChange={(e) => handleInputChange("Warehouse_Capacity", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Demand Drivers & Pricing */}
            <div className="form-fieldset">
              <div className="fieldset-legend">Pricing &amp; Market Drivers</div>
              <div className="form-group-grid">
                <div className="form-field">
                  <label className="field-label" htmlFor="studio-price">Retail Price (₹)</label>
                  <input
                    id="studio-price"
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
                  <label className="field-label" htmlFor="studio-comp-price">Competitor Price (₹)</label>
                  <input
                    id="studio-comp-price"
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <label className="field-label" htmlFor="studio-discount">Promotional Discount Rate</label>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                      {formData["Discount"]}%
                    </span>
                  </div>
                  <input
                    id="studio-discount"
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
                        id={`studio-weather-${cond.toLowerCase()}`}
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
                  <label className="field-label">Marketing Promotion</label>
                  <div className="toggle-pills">
                    <button
                      id="studio-promo-yes"
                      type="button"
                      className={`toggle-pill-btn ${formData["Promotion"] === 1 ? 'active' : ''}`}
                      onClick={() => handleInputChange("Promotion", 1)}
                    >
                      Active
                    </button>
                    <button
                      id="studio-promo-no"
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

            {/* Advanced Demand Lags Toggle */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <span>Advanced Time-Series Lag Drivers</span>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvanced && (
                <div style={{ padding: '14px', background: 'var(--bg-input)', borderTop: '1px solid var(--border-color)' }}>
                  <div className="form-group-grid">
                    <div className="form-field">
                      <label className="field-label" htmlFor="studio-lag-1">Lag 1D Demand</label>
                      <input
                        id="studio-lag-1"
                        type="number"
                        className="pro-input"
                        value={formData["Demand_lag_1"]}
                        onChange={(e) => handleInputChange("Demand_lag_1", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-label" htmlFor="studio-roll-7">7D Rolling Avg</label>
                      <input
                        id="studio-roll-7"
                        type="number"
                        className="pro-input"
                        value={formData["Demand_roll_7"]}
                        onChange={(e) => handleInputChange("Demand_roll_7", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 8: Optimize Inventory Action Button */}
            <button
              id="btn-run-studio-pipeline"
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Solving SciPy / OR-Tools Optimization...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Optimize Inventory</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* SECTION 8: OPTIMIZATION RESULT PANEL */}
        <div className="pro-card results-card" id="optimization-result-panel">
          <div className="card-header-bar">
            <h3 className="card-title">
              <ShoppingCart className="card-icon" size={18} style={{ color: 'var(--brand-primary)' }} />
              Optimization Result
            </h3>
            <span className="field-hint">
              {result ? 'Computed' : 'Awaiting Execution'}
            </span>
          </div>

          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '14px' }}>
              <strong>Optimization Error:</strong> {error}
            </div>
          )}

          {result ? (
            <>
              {/* Primary Recommended Order Quantity Result */}
              <div className="exec-metric-card" style={{ marginBottom: '16px' }}>
                <div className="exec-metric-header">
                  <span className="exec-metric-label">Recommended Order Quantity</span>
                  <span className={`tag-badge ${result.reorder_decision ? 'warning' : 'success'}`}>
                    {result.reorder_decision ? 'REORDER REQUIRED' : 'STOCK ADEQUATE'}
                  </span>
                </div>
                <div className="exec-metric-val">
                  {result.recommended_order_quantity}
                  <span className="exec-metric-unit">Units</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Node: <strong>{formData["Warehouse_ID"]}</strong> &bull; SKU: <strong>{formData["SKU_ID"]}</strong>
                </div>
              </div>

              {/* The 7 Exact Optimization Metrics required in Section 8 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {/* 1. Current Inventory */}
                <div style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Current Inventory</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {formData["Inventory_Level"]} units
                  </div>
                </div>

                {/* 2. Forecasted Demand */}
                <div style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Forecasted Demand</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>
                    {Math.round(result.predicted_demand)} units
                  </div>
                </div>

                {/* 3. Safety Stock */}
                <div style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Safety Stock Buffer</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {safetyStockVal} units
                  </div>
                </div>

                {/* 4. Warehouse Capacity */}
                <div style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Warehouse Capacity Limit</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {capacityVal} units
                  </div>
                </div>

                {/* 5. Ordering Constraint */}
                <div style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Ordering Constraint Bound</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    Max Order: {Math.max(0, capacityVal - formData["Inventory_Level"])} units
                  </div>
                </div>

                {/* 6. Optimization Status */}
                <div style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Optimization Status</div>
                  <div style={{ marginTop: '2px' }}>
                    <span className={`tag-badge ${result.stock_status === 'STABLE' ? 'success' : 'danger'}`}>
                      {result.stock_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stockout Warning Banner if needed */}
              {result.potential_stockout && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', marginBottom: '14px' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Stockout Alert:</strong> Projected demand exceeds available inventory before replenishment!
                  </div>
                </div>
              )}

              {/* Balance Transition Equation */}
              <div className="gauge-card">
                <div className="gauge-header">
                  <span>Balance Equation Solver</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {formData["Inventory_Level"]} current + {result.recommended_order_quantity} ordered - {Math.round(result.predicted_demand)} demand = {result.expected_inventory} post-sales
                  </span>
                </div>
                <div className="gauge-track">
                  <div 
                    className="gauge-fill"
                    style={{
                      width: `${Math.min(100, Math.max(10, (result.expected_inventory / 300) * 100))}%`,
                      background: result.expected_inventory >= safetyStockVal ? 'var(--success)' : 'var(--danger)'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <span>Estimated Holding &amp; Ordering Cost:</span>
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  ₹{result.estimated_inventory_cost.toLocaleString()}
                </strong>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-tertiary)' }}>
              <Clock size={28} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '0.9rem' }}>
                Optimization Result Awaiting Run
              </div>
              <p style={{ fontSize: '0.78rem', maxWidth: '320px', margin: '0 auto' }}>
                Adjust inventory level, safety stock buffer, and retail pricing, then click <strong>Optimize Inventory</strong> to invoke the solver.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
