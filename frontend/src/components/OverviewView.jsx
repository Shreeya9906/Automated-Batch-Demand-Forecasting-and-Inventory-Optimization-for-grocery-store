import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { GROCERY_CATALOG } from '../data/presets';
import DemandForecastChart from './DemandForecastChart';
import WarehouseCapacitySection from './WarehouseCapacitySection';
import { optimizeSingleSku } from '../services/api';

export default function OverviewView({ setActiveView, onSelectCatalogItem, searchQuery = '' }) {
  // Live optimization results map: { [sku]: { orderQty, loading } }
  const [optimizationResults, setOptimizationResults] = useState({});
  const [batchOptimizing, setBatchOptimizing] = useState(false);

  // Categorize catalog items
  const allItems = GROCERY_CATALOG;
  const atRiskAll = allItems.filter(item => item.inStock <= item.rop);
  const criticalItems = allItems.filter(item => item.inStock < (item.safetyStock || item.rop * 0.5));
  const healthyItems = allItems.filter(item => item.inStock > item.rop);

  // Search filter
  const query = (searchQuery || '').trim().toLowerCase();
  const filteredAtRisk = atRiskAll.filter(item => {
    if (!query) return true;
    return (
      item.sku.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.warehouse.toLowerCase().includes(query)
    );
  });

  // Run optimization for an individual SKU using backend
  const handleOptimizeSku = async (item) => {
    setOptimizationResults(prev => ({
      ...prev,
      [item.sku]: { ...prev[item.sku], loading: true }
    }));

    try {
      const res = await optimizeSingleSku(item);
      if (res.success && res.data) {
        setOptimizationResults(prev => ({
          ...prev,
          [item.sku]: {
            orderQty: res.data.recommended_order_quantity,
            loading: false,
          }
        }));
      } else {
        setOptimizationResults(prev => ({
          ...prev,
          [item.sku]: {
            orderQty: item.recommendedOrder ?? 0,
            loading: false,
          }
        }));
      }
    } catch (e) {
      setOptimizationResults(prev => ({
        ...prev,
        [item.sku]: {
          orderQty: item.recommendedOrder ?? 0,
          loading: false,
        }
      }));
    }
  };

  // Run batch optimization for all flagged items
  const handleBatchOptimizeAll = async () => {
    setBatchOptimizing(true);
    for (const item of filteredAtRisk) {
      await handleOptimizeSku(item);
    }
    setBatchOptimizing(false);
  };

  return (
    <div className="section-container">
      {/* Top 4 Essential KPI Cards */}
      <div className="kpi-row-grid" style={{ marginBottom: '22px' }}>
        {/* CARD 1: FORECASTED DEMAND */}
        <div className="pro-kpi-card" id="kpi-forecasted-demand">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Forecasted Demand</span>
            <TrendingUp size={16} color="var(--brand-primary, #0284c7)" />
          </div>
          <div className="kpi-card-val">
            112 <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>units/day</span>
          </div>
          <div className="kpi-card-sub" style={{ color: 'var(--success, #10b981)' }}>
            Next 7-Day Horizon &bull; Trend: +4.2%
          </div>
        </div>

        {/* CARD 2: AT-RISK SKUs */}
        <div className="pro-kpi-card" id="kpi-at-risk-skus">
          <div className="kpi-card-header">
            <span className="kpi-card-title">At-Risk Inventory</span>
            <AlertTriangle size={16} color="var(--warning, #f59e0b)" />
          </div>
          <div className="kpi-card-val" style={{ color: 'var(--warning, #f59e0b)' }}>
            {atRiskAll.length} SKUs
          </div>
          <div className="kpi-card-sub">
            <span style={{ color: 'var(--danger, #ef4444)', fontWeight: 600 }}>{criticalItems.length} Critical</span> &bull; Stock &le; Reorder Point
          </div>
        </div>

        {/* CARD 3: INVENTORY HEALTH */}
        <div className="pro-kpi-card" id="kpi-inventory-health">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Inventory Health</span>
            <Package size={16} color="var(--brand-accent, #38bdf8)" />
          </div>
          <div className="kpi-card-val" style={{ fontSize: '1.45rem' }}>
            <span style={{ color: 'var(--success, #10b981)' }}>{healthyItems.length} Healthy</span>
            <span style={{ color: 'var(--text-tertiary)', margin: '0 6px' }}>/</span>
            <span style={{ color: 'var(--warning, #f59e0b)' }}>{atRiskAll.length} At-Risk</span>
          </div>
          <div className="kpi-card-sub">
            {allItems.length} Active Catalog SKUs Monitored
          </div>
        </div>

      </div>

      {/* Large Demand Forecast Chart */}
      <DemandForecastChart onSelectSkuForStudio={onSelectCatalogItem} />

      {/* Immediate Replenishment Watchlist */}
      <div className="pro-card" style={{ marginBottom: '24px' }}>
        <div className="card-header-bar">
          <div>
            <h3 className="card-title">
              <AlertTriangle className="card-icon" size={17} style={{ color: 'var(--warning, #f59e0b)' }} />
              Immediate Replenishment Watchlist
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
              Items with current inventory at or below reorder point requiring replenishment.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="tag-badge warning">
              {filteredAtRisk.length} Items Flagged
            </span>

            <button
              type="button"
              className="submit-btn"
              style={{ width: 'auto', padding: '6px 14px', fontSize: '0.76rem', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={handleBatchOptimizeAll}
              disabled={batchOptimizing}
            >
              {batchOptimizing ? (
                <>
                  <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Zap size={13} />
                  <span>Optimize All Flagged</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="catalog-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>SKU ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Warehouse</th>
                <th>Current Stock</th>
                <th>Forecast Demand</th>
                <th>Safety Stock</th>
                <th>Reorder Point</th>
                <th style={{ color: 'var(--brand-accent, #38bdf8)' }}>Recommended Order</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAtRisk.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No flagged items match &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              ) : (
                filteredAtRisk.map(item => {
                  const optState = optimizationResults[item.sku];
                  const hasBackendOrder = optState?.orderQty !== undefined;
                  const displayOrder = hasBackendOrder 
                    ? optState.orderQty 
                    : (item.recommendedOrder ?? 0);
                  const isCritical = item.inStock < (item.safetyStock || item.rop * 0.5);

                  return (
                    <tr key={item.sku}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {item.sku}
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <span className="tag-badge info">{item.warehouse}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: isCritical ? 'var(--danger, #ef4444)' : 'var(--warning, #f59e0b)', fontWeight: 700 }}>
                        {item.inStock} u
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {item.forecastDemand} u
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                        {item.safetyStock} u
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {item.rop} u
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--brand-primary, #0284c7)' }}>
                        {optState?.loading ? (
                          <div className="spinner" style={{ width: '12px', height: '12px', display: 'inline-block' }}></div>
                        ) : (
                          <span>{displayOrder} units</span>
                        )}
                      </td>
                      <td>
                        <span className={`tag-badge ${isCritical ? 'danger' : 'warning'}`}>
                          {isCritical ? 'CRITICAL' : 'AT RISK'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="submit-btn"
                            style={{ padding: '4px 10px', fontSize: '0.72rem', margin: 0, width: 'auto' }}
                            onClick={() => handleOptimizeSku(item)}
                            disabled={optState?.loading}
                          >
                            Optimize
                          </button>
                          <button
                            type="button"
                            className="toggle-pill-btn"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', margin: 0 }}
                            onClick={() => onSelectCatalogItem(item)}
                            title="Open in Studio"
                          >
                            Studio
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warehouse Capacity Section */}
      <WarehouseCapacitySection />
    </div>
  );
}
