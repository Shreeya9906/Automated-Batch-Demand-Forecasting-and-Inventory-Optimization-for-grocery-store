import React, { useState } from 'react';
import { 
  Package, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Zap,
  AlertTriangle
} from 'lucide-react';
import { GROCERY_CATALOG, WAREHOUSE_OPTIONS, CATEGORIES } from '../data/presets';

export default function CatalogMatrixView({ onSelectCatalogItem, searchQuery }) {
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL, Healthy, At Risk, Critical, Overstocked

  const filteredItems = GROCERY_CATALOG.filter(item => {
    const isCritical = item.inStock < (item.safetyStock || item.rop * 0.5);
    const isAtRisk = item.inStock <= item.rop && !isCritical;
    const isHealthy = item.inStock > item.rop;
    const isOverstocked = false; // no overstocked in demo data

    let matchStatus = true;
    if (selectedStatus === 'Critical') matchStatus = isCritical;
    else if (selectedStatus === 'At Risk') matchStatus = isAtRisk;
    else if (selectedStatus === 'Healthy') matchStatus = isHealthy;
    else if (selectedStatus === 'Overstocked') matchStatus = isOverstocked;

    const matchesWarehouse = selectedWarehouse === 'ALL' || item.warehouse === selectedWarehouse;
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesWarehouse && matchesCategory && matchesSearch && matchStatus;
  });

  return (
    <div className="section-container">
      {/* Filters Toolbar (Section 14) */}
      <div className="pro-card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Status:
            </span>
            <div className="toggle-pills">
              {['ALL', 'Healthy', 'At Risk', 'Critical', 'Overstocked'].map(st => (
                <button
                  key={st}
                  type="button"
                  className={`toggle-pill-btn ${selectedStatus === st ? 'active' : ''}`}
                  onClick={() => setSelectedStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Node and Category Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Node:</span>
              <select
                className="pro-select"
                style={{ width: '110px', padding: '5px 8px', fontSize: '0.78rem' }}
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                <option value="ALL">All Hubs</option>
                {WAREHOUSE_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
              <select
                className="pro-select"
                style={{ width: '130px', padding: '5px 8px', fontSize: '0.78rem' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table with Section 14 Columns */}
      <div className="pro-card" style={{ padding: 0 }}>
        <div className="card-header-bar" style={{ padding: '16px 20px', margin: 0 }}>
          <h3 className="card-title">
            <Package className="card-icon" size={17} />
            SKU Inventory &amp; Constraint Matrix ({filteredItems.length} SKUs Listed)
          </h3>
          <span className="field-hint">Synchronized with XGBoost batch forecast &amp; inventory bounds</span>
        </div>

        <div className="catalog-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th>SKU ID</th>
                <th>Item Description</th>
                <th>Category</th>
                <th>Node</th>
                <th>Current Stock</th>
                <th>Forecast Demand</th>
                <th>Safety Stock</th>
                <th>Reorder Pt</th>
                <th style={{ color: 'var(--brand-accent)' }}>Recommended Order</th>
                <th>WH Capacity</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No SKUs match the current status and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isCritical = item.inStock < (item.safetyStock || item.rop * 0.5);
                  const isAtRisk = item.inStock <= item.rop && !isCritical;

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
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isCritical ? 'var(--danger)' : isAtRisk ? 'var(--warning)' : 'var(--text-primary)' }}>
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
                      {/* Section 14 Column: Recommended Order */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                        {item.recommendedOrder ?? 0} u
                      </td>
                      {/* Section 14 Column: Warehouse Capacity */}
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                        {item.warehouseCapacity || 500} u
                      </td>
                      <td>
                        {isCritical ? (
                          <span className="tag-badge danger">
                            <AlertTriangle size={12} />
                            CRITICAL
                          </span>
                        ) : isAtRisk ? (
                          <span className="tag-badge warning">
                            <ShieldAlert size={12} />
                            AT RISK
                          </span>
                        ) : (
                          <span className="tag-badge success">
                            <ShieldCheck size={12} />
                            HEALTHY
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="submit-btn"
                          style={{ padding: '4px 10px', fontSize: '0.72rem', margin: 0, width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onSelectCatalogItem(item)}
                          title={`Send ${item.sku} to Studio`}
                        >
                          <Zap size={12} />
                          <span>Studio</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
