import React, { useState } from 'react';
import { 
  Columns3, 
  Zap, 
  Sliders, 
  Clock
} from 'lucide-react';
import { PRESETS } from '../data/presets';
import { optimizeInventory } from '../services/api';

export default function ScenarioComparison() {
  const [selectedPresetId, setSelectedPresetId] = useState('promo_surge');
  
  // Interactive What-If modification sliders (Section 13)
  const [demandShiftPct, setDemandShiftPct] = useState(20); // -50% to +50%
  const [inventoryLevel, setInventoryLevel] = useState(45);
  const [warehouseCapacity, setWarehouseCapacity] = useState(500);
  const [leadTimeDays, setLeadTimeDays] = useState(3);
  const [safetyStockBuffer, setSafetyStockBuffer] = useState(30);

  const [loading, setLoading] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [error, setError] = useState(null);

  const currentPreset = PRESETS.find(p => p.id === selectedPresetId) || PRESETS[0];

  const handleRunWhatIfSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Base / Original Scenario Run
      const basePayload = { ...currentPreset.payload };
      const baseRes = await optimizeInventory(basePayload);

      // 2. Adjusted Scenario Run
      // Demand shift adjusts the lag and roll drivers:
      const shiftMultiplier = 1 + (demandShiftPct / 100);
      const adjustedPayload = {
        ...basePayload,
        "Price": parseFloat(basePayload["Price"]),
        "Discount": parseFloat(basePayload["Discount"]),
        "Demand_lag_1": Math.round(parseFloat(basePayload["Demand_lag_1"]) * shiftMultiplier),
        "Demand_lag_7": Math.round(parseFloat(basePayload["Demand_lag_7"]) * shiftMultiplier),
        "Demand_roll_7": Math.round(parseFloat(basePayload["Demand_roll_7"]) * shiftMultiplier),
        "Inventory_Level": parseFloat(inventoryLevel),
        "Reorder_Point": Math.round(parseFloat(basePayload["Reorder_Point"]) * (leadTimeDays / 3)),
        "Safety_Stock": parseFloat(safetyStockBuffer),
        "Warehouse_Capacity": parseFloat(warehouseCapacity),
      };

      const adjRes = await optimizeInventory(adjustedPayload);

      if (baseRes.success && adjRes.success) {
        setSimulationData({
          base: {
            forecast: Math.round(baseRes.data.predicted_demand),
            orderQty: baseRes.data.recommended_order_quantity,
            stockStatus: baseRes.data.stock_status,
            cost: baseRes.data.estimated_inventory_cost,
            inventory: basePayload["Inventory_Level"],
            capacity: 500,
          },
          adjusted: {
            forecast: Math.round(adjRes.data.predicted_demand),
            orderQty: adjRes.data.recommended_order_quantity,
            stockStatus: adjRes.data.stock_status,
            cost: adjRes.data.estimated_inventory_cost,
            inventory: inventoryLevel,
            capacity: warehouseCapacity,
          },
          demandShiftPct,
        });
      } else {
        setError(baseRes.error || adjRes.error || 'Failed to simulate what-if scenario.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-container" role="tabpanel">
      {/* Title Header */}
      <div className="card-header-bar" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="card-title">
            <Columns3 className="card-icon" size={18} color="var(--brand-primary)" />
            What-If Scenario Simulation
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Simulate and evaluate replenishment decisions when modifying demand surges, current stock, warehouse capacity, lead time, and safety buffers.
          </p>
        </div>

        <button
          id="btn-run-whatif"
          type="button"
          className="submit-btn"
          style={{ width: 'auto', padding: '8px 18px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          onClick={handleRunWhatIfSimulation}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              <span>Simulating with Solver...</span>
            </>
          ) : (
            <>
              <Zap size={15} />
              <span>Simulate What-If Scenario</span>
            </>
          )}
        </button>
      </div>

      <div className="workspace-grid">
        {/* Left: What-If Slider Controls (Section 13) */}
        <div className="pro-card">
          <div className="card-header-bar">
            <h3 className="card-title" style={{ fontSize: '0.92rem' }}>
              <Sliders className="card-icon" size={16} />
              Modify What-If Scenario Levers
            </h3>
            <span className="field-hint">Dynamic Parameters</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Baseline Benchmark Selection */}
            <div className="form-field">
              <label className="field-label" htmlFor="whatif-baseline-select">
                Baseline Reference Scenario
              </label>
              <select
                id="whatif-baseline-select"
                className="pro-select"
                value={selectedPresetId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setSelectedPresetId(pid);
                  const p = PRESETS.find(x => x.id === pid);
                  if (p) {
                    setInventoryLevel(p.payload["Inventory_Level"]);
                  }
                }}
              >
                {PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.badge}) — {preset.payload["Warehouse_ID"]} / {preset.payload["SKU_ID"]}
                  </option>
                ))}
              </select>
              <span className="field-hint" style={{ marginTop: '4px' }}>
                Base context: {currentPreset.description}
              </span>
            </div>
            {/* 1. Demand Increase / Decrease % */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="field-label" htmlFor="slider-demand-shift">
                  Demand Shift (%)
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: demandShiftPct >= 0 ? 'var(--brand-primary)' : 'var(--warning)' }}>
                  {demandShiftPct > 0 ? `+${demandShiftPct}%` : `${demandShiftPct}%`}
                </span>
              </div>
              <input
                id="slider-demand-shift"
                type="range"
                min="-50"
                max="50"
                step="5"
                value={demandShiftPct}
                onChange={(e) => setDemandShiftPct(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                <span>-50% Slump</span>
                <span>Baseline (0%)</span>
                <span>+50% Surge</span>
              </div>
            </div>

            {/* 2. Inventory Level */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="field-label" htmlFor="slider-inventory-level">
                  Current Inventory Level
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {inventoryLevel} units
                </span>
              </div>
              <input
                id="slider-inventory-level"
                type="range"
                min="0"
                max="300"
                step="5"
                value={inventoryLevel}
                onChange={(e) => setInventoryLevel(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-accent)' }}
              />
            </div>

            {/* 3. Warehouse Capacity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="field-label" htmlFor="slider-warehouse-capacity">
                  Warehouse Capacity Upper Limit
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {warehouseCapacity} units
                </span>
              </div>
              <input
                id="slider-warehouse-capacity"
                type="range"
                min="100"
                max="800"
                step="25"
                value={warehouseCapacity}
                onChange={(e) => setWarehouseCapacity(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {/* 4. Lead Time Days */}
              <div>
                <label className="field-label" htmlFor="input-lead-time">
                  Lead Time (Days)
                </label>
                <input
                  id="input-lead-time"
                  type="number"
                  min="1"
                  max="14"
                  className="pro-input"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                />
              </div>

              {/* 5. Safety Stock */}
              <div>
                <label className="field-label" htmlFor="input-safety-stock">
                  Safety Stock Buffer
                </label>
                <input
                  id="input-safety-stock"
                  type="number"
                  min="0"
                  max="100"
                  className="pro-input"
                  value={safetyStockBuffer}
                  onChange={(e) => setSafetyStockBuffer(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Side-by-Side Comparison Matrix (Section 13 Before vs After) */}
        <div className="pro-card">
          <div className="card-header-bar">
            <h3 className="card-title" style={{ fontSize: '0.92rem' }}>
              Before &amp; After Decision Comparison
            </h3>
            <span className="field-hint">FastAPI /optimize Verification</span>
          </div>

          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '14px' }}>
              <strong>Simulation Error:</strong> {error}
            </div>
          )}

          {simulationData ? (
            <div>
              {/* Demand Change Banner */}
              <div style={{ padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Applied Demand Shift:
                </span>
                <span className="tag-badge info" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                  {simulationData.demandShiftPct > 0 ? `+${simulationData.demandShiftPct}%` : `${simulationData.demandShiftPct}%`}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {/* Before / Original */}
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      Baseline (Before)
                    </span>
                    <span className="tag-badge info">Original</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Forecasted Demand</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {simulationData.base.forecast} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>units</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Inventory Decision (Order)</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {simulationData.base.orderQty} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>units</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Status:</span>
                      <span className={`tag-badge ${simulationData.base.stockStatus === 'STABLE' ? 'success' : 'danger'}`}>
                        {simulationData.base.stockStatus}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Est Cost:</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>${simulationData.base.cost}</strong>
                    </div>
                  </div>
                </div>

                {/* After / Adjusted */}
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--brand-primary)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                      Adjusted (After)
                    </span>
                    <span className="tag-badge success">What-If Result</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Adjusted Forecast</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>
                        {simulationData.adjusted.forecast} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>units</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Adjusted Order Decision</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-accent)' }}>
                        {simulationData.adjusted.orderQty} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>units</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Status:</span>
                      <span className={`tag-badge ${simulationData.adjusted.stockStatus === 'STABLE' ? 'success' : 'danger'}`}>
                        {simulationData.adjusted.stockStatus}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Est Cost:</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>${simulationData.adjusted.cost}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-tertiary)' }}>
              <Clock size={28} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '0.88rem' }}>
                Simulation Awaiting Execution
              </div>
              <p style={{ fontSize: '0.76rem', maxWidth: '300px', margin: '0 auto' }}>
                Configure the demand shift %, warehouse capacity, or lead time sliders, then click <strong>Simulate What-If Scenario</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
