import React from 'react';
import { Warehouse, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { WAREHOUSE_CAPACITY_DATA } from '../data/presets';

export default function WarehouseCapacitySection() {
  return (
    <div className="pro-card" style={{ marginBottom: '24px' }}>
      <div className="card-header-bar">
        <div>
          <h3 className="card-title">
            <Warehouse className="card-icon" size={17} style={{ color: 'var(--brand-accent)' }} />
            Warehouse Fulfillment Capacity &amp; Constraints
          </h3>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
            Storage utilization and capacity thresholds across regional fulfillment hubs.
          </span>
        </div>
        <span className="tag-badge info">
          5 Hubs Monitored
        </span>
      </div>

      <div className="catalog-table-container">
        <table className="pro-table">
          <thead>
            <tr>
              <th>Node ID</th>
              <th>Facility Name &amp; Region</th>
              <th>Current Inventory</th>
              <th>Maximum Capacity</th>
              <th style={{ width: '280px' }}>Storage Utilization</th>
              <th>Constraint Status</th>
            </tr>
          </thead>
          <tbody>
            {WAREHOUSE_CAPACITY_DATA.map((wh) => {
              const utilPct = Math.round((wh.currentStock / wh.capacity) * 100);
              const isNearCap = utilPct >= 85;
              const isConstrained = utilPct >= 95;

              let statusBadgeClass = 'success';
              let progressColor = 'var(--success, #10b981)';

              if (isConstrained) {
                statusBadgeClass = 'danger';
                progressColor = 'var(--danger, #ef4444)';
              } else if (isNearCap) {
                statusBadgeClass = 'warning';
                progressColor = 'var(--warning, #f59e0b)';
              }

              return (
                <tr key={wh.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    <span className="tag-badge info">{wh.id}</span>
                  </td>
                  <td>
                    <strong>{wh.name}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{wh.location}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {wh.currentStock.toLocaleString()} units
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {wh.capacity.toLocaleString()} units
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div 
                        style={{ 
                          flex: 1, 
                          height: '8px', 
                          background: 'var(--bg-input)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}
                      >
                        <div 
                          style={{ 
                            width: `${Math.min(100, utilPct)}%`, 
                            height: '100%', 
                            background: progressColor,
                            borderRadius: '9999px',
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: progressColor, width: '42px', textAlign: 'right' }}>
                        {utilPct}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`tag-badge ${statusBadgeClass}`}>
                      {isNearCap ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                      {wh.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
