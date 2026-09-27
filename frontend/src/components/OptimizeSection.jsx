import React, { useState } from 'react';
import { 
  Package, 
  ShoppingCart, 
  ShieldAlert, 
  ShieldCheck, 
  DollarSign, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Zap,
  Clock
} from 'lucide-react';
import { 
  WAREHOUSE_OPTIONS, 
  SKU_OPTIONS, 
  STORE_OPTIONS, 
  WEATHER_CONDITIONS, 
  SEASONS 
} from '../data/presets';
import { optimizeInventory } from '../services/api';

export default function OptimizeSection({ formData, setFormData }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDemandSettings, setShowDemandSettings] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptimizeSubmit = async (e) => {
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
      "Warehouse_ID": formData["Warehouse_ID"] || "WH_1",
      "SKU_ID": formData["SKU_ID"] || "SKU_1",
      "Inventory_Level": parseFloat(formData["Inventory_Level"]) || 0,
      "Reorder_Point": parseFloat(formData["Reorder_Point"]) || 0,
    };

    const res = await optimizeInventory(payload);
    setLoading(false);

    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="section-container" role="tabpanel">
      <div className="workspace-grid">
        {/* Input Parameters Form */}
        <div className="pro-card">
          <div className="card-header-bar">
            <h2 className="card-title">
              <Package className="card-icon" size={18} />
              Inventory Replenishment Configuration
            </h2>
            <span className="tag-badge info">
              Supply Decision Model
            </span>
          </div>

          <form onSubmit={handleOptimizeSubmit}>
            {/* Fulfillment Node */}
            <div className="form-fieldset">
              <div className="fieldset-legend">Fulfillment Node Selection</div>
              <div className="form-group-grid">
                <div className="form-field">
                  <label className="field-label" htmlFor="opt-warehouse-id">Warehouse Node</label>
                  <select
                    id="opt-warehouse-id"
                    className="pro-select"
                    value={formData["Warehouse_ID"] || "WH_1"}
                    onChange={(e) => handleInputChange("Warehouse_ID", e.target.value)}
                  >
                    {WAREHOUSE_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label" htmlFor="opt-sku-id">Warehouse SKU ID</label>
                  <select
                    id="opt-sku-id"
                    className="pro-select"
                    value={formData["SKU_ID"] || "SKU_1"}
                    onChange={(e) => handleInputChange("SKU_ID", e.target.value)}
                  >
                    {SKU_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory Levels */}
            <div className="form-fieldset">
              <div className="fieldset-legend">Inventory &amp; Thresholds</div>
              <div className="form-group-grid">
                <div className="form-field full-width">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="field-label" htmlFor="opt-inventory-level">
                      Current In-Stock Quantity (Units)
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[25, 75, 150, 300].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleInputChange("Inventory_Level", amt)}
                          className="toggle-pill-btn"
                          style={{ padding: '2px 7px', fontSize: '0.7rem' }}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    id="opt-inventory-level"
                    type="number"
                    step="1"
                    min="0"
                    className="pro-input"
                    value={formData["Inventory_Level"] ?? 100}
                    onChange={(e) => handleInputChange("Inventory_Level", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <label className="field-label" htmlFor="opt-reorder-point">
                    <span>Reorder Point Threshold (ROP)</span>
                    <span className="field-hint">Minimum buffer triggering order</span>
                  </label>
                  <input
                    id="opt-reorder-point"
                    type="number"
                    step="1"
                    min="0"
                    className="pro-input"
                    value={formData["Reorder_Point"] ?? 50}
                    onChange={(e) => handleInputChange("Reorder_Point", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Collapsible Market Signals */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setShowDemandSettings(!showDemandSettings)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <span>Adjust Upstream Market &amp; Price Drivers</span>
                {showDemandSettings ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showDemandSettings && (
                <div style={{ padding: '14px', background: 'var(--bg-input)', borderTop: '1px solid var(--border-color)' }}>
                  <div className="form-group-grid">
                    <div className="form-field">
                      <label className="field-label" htmlFor="opt-store-id">Store ID</label>
                      <select
                        id="opt-store-id"
                        className="pro-select"
                        value={formData["Store ID"]}
                        onChange={(e) => handleInputChange("Store ID", e.target.value)}
                      >
                        {STORE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="field-label" htmlFor="opt-price">Retail Price ($)</label>
                      <input
                        id="opt-price"
                        type="number"
                        step="0.01"
                        className="pro-input"
                        value={formData["Price"]}
                        onChange={(e) => handleInputChange("Price", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="form-field">
                      <label className="field-label" htmlFor="opt-weather">Weather</label>
                      <select
                        id="opt-weather"
                        className="pro-select"
                        value={formData["Weather Condition"]}
                        onChange={(e) => handleInputChange("Weather Condition", e.target.value)}
                      >
                        {WEATHER_CONDITIONS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="field-label" htmlFor="opt-promo">Promotion</label>
                      <select
                        id="opt-promo"
                        className="pro-select"
                        value={formData["Promotion"]}
                        onChange={(e) => handleInputChange("Promotion", parseInt(e.target.value))}
                      >
                        <option value={1}>Active Campaign</option>
                        <option value={0}>Standard (Inactive)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              id="btn-run-optimization"
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Computing Optimization...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Compute Replenishment Decision</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Replenishment Decision Display */}
        <div className="pro-card results-card">
          <div className="card-header-bar">
            <h3 className="card-title">
              <ShoppingCart className="card-icon" size={18} />
              Optimization Output
            </h3>
            <span className="field-hint">
              {result ? 'Computed' : 'Awaiting Input'}
            </span>
          </div>

          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.82rem' }}>
              <strong>Optimization Failed:</strong> {error}
            </div>
          )}

          {result ? (
            <>
              {/* Primary Order Stat */}
              <div className="exec-metric-card">
                <div className="exec-metric-header">
                  <span className="exec-metric-label">Recommended Order</span>
                  <span className={`tag-badge ${result.reorder_decision ? 'warning' : 'success'}`}>
                    {result.reorder_decision ? 'ORDER REQUIRED' : 'STOCK ADEQUATE'}
                  </span>
                </div>
                <div className="exec-metric-val">
                  {result.recommended_order_quantity}
                  <span className="exec-metric-unit">Units</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Target Node: <strong>{formData["Warehouse_ID"]}</strong> &bull; SKU: <strong>{formData["SKU_ID"]}</strong>
                </div>
              </div>

              {/* Stockout Risk Callout */}
              {result.potential_stockout && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Stockout Alert:</strong> Projected demand exceeds available stock plus safe buffer.
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="decision-cards-grid">
                <div className="metric-pill-card">
                  <span className="metric-pill-title">Service Health</span>
                  <div style={{ marginTop: '2px' }}>
                    <span className={`tag-badge ${result.stock_status === 'STABLE' ? 'success' : 'danger'}`}>
                      {result.stock_status === 'STABLE' ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                      {result.stock_status}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Relative to safety stock
                  </span>
                </div>

                <div className="metric-pill-card">
                  <span className="metric-pill-title">Post-Sales Ending Stock</span>
                  <div className="metric-pill-value">
                    {result.expected_inventory}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '3px' }}>u</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    Projected after sales
                  </span>
                </div>

                <div className="metric-pill-card">
                  <span className="metric-pill-title">Forecasted Daily Demand</span>
                  <div className="metric-pill-value">
                    {result.predicted_demand > 0 ? Math.round(result.predicted_demand) : 0}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '3px' }}>u</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    XGBoost demand rate
                  </span>
                </div>

                <div className="metric-pill-card">
                  <span className="metric-pill-title">Estimated Total Cost</span>
                  <div className="metric-pill-value" style={{ display: 'flex', alignItems: 'center' }}>
                    <DollarSign size={16} />
                    {result.estimated_inventory_cost.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    Holding + Ordering fees
                  </span>
                </div>
              </div>

              {/* Inventory Flow Balance */}
              <div className="inventory-flow-card">
                <div className="inventory-bar-labels">
                  <span>Balance: {formData["Inventory_Level"]} in-stock + {result.recommended_order_quantity} ordered - {Math.round(result.predicted_demand)} demand</span>
                  <span>{result.expected_inventory} net</span>
                </div>
                <div className="inventory-progress-track">
                  <div 
                    className="inventory-progress-fill"
                    style={{
                      width: `${Math.min(100, Math.max(8, (result.expected_inventory / 300) * 100))}%`,
                      background: result.expected_inventory > 50 ? 'var(--success)' : 'var(--danger)'
                    }}
                  />
                </div>
              </div>

              {/* JSON Accordion */}
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
                Optimization Engine Idle
              </div>
              <p style={{ fontSize: '0.78rem', maxWidth: '280px', margin: '0 auto' }}>
                Configure warehouse parameters and click <strong>Compute Replenishment Decision</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
