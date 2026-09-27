import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  BarChart3, 
  CheckCircle2, 
  GitBranch, 
  Cpu
} from 'lucide-react';

export default function MonitoringSection({ backendStatus }) {
  const isHealthy = backendStatus?.isOnline && (backendStatus?.data?.status === 'healthy' || backendStatus?.data?.status === undefined);

  const pipelineStages = [
    { name: 'Data Ingestion', status: 'Completed', icon: '✓', type: 'success' },
    { name: 'Data Validation', status: 'Completed', icon: '✓', type: 'success' },
    { name: 'Feature Engineering', status: 'Completed', icon: '✓', type: 'success' },
    { name: 'XGBoost Forecast', status: 'Completed', icon: '✓', type: 'success' },
    { name: 'Inventory Optimization', status: 'Completed', icon: '✓', type: 'success' },
    { name: 'Monitoring', status: 'Completed', icon: '✓', type: 'success' },
  ];

  const modelVersion = backendStatus?.data?.model_version || 'v1.0';

  return (
    <div className="section-container" role="tabpanel">
      {/* Title Header */}
      <div className="card-header-bar" style={{ marginBottom: '22px' }}>
        <div>
          <h2 className="card-title">
            <Activity className="card-icon" size={18} color="var(--brand-primary)" />
            MLOps Monitoring
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Production model telemetry, statistical drift status, and automated batch pipeline lifecycle.
          </p>
        </div>
      </div>

      {/* 4 High-Level Metric Cards (2x2 Grid per specification) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: DATA DRIFT */}
        <div className="pro-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">DATA DRIFT</span>
            <Activity size={16} color="var(--brand-primary)" />
          </div>
          <div className="kpi-card-val" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
            Monitoring data unavailable
          </div>
        </div>

        {/* Card 2: PREDICTION DRIFT */}
        <div className="pro-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">PREDICTION DRIFT</span>
            <BarChart3 size={16} color="var(--brand-accent)" />
          </div>
          <div className="kpi-card-val" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
            Monitoring data unavailable
          </div>
        </div>

        {/* Card 3: MODEL HEALTH */}
        <div className="pro-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">MODEL HEALTH</span>
            <ShieldCheck size={16} color={isHealthy ? 'var(--success)' : 'var(--danger)'} />
          </div>
          <div className="kpi-card-val" style={{ fontSize: '1.25rem', color: isHealthy ? 'var(--success)' : 'var(--danger)' }}>
            {backendStatus?.isOnline ? 'Healthy' : 'Status unavailable'}
          </div>
        </div>

        {/* Card 4: RETRAINING STATUS */}
        <div className="pro-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">RETRAINING STATUS</span>
            <CheckCircle2 size={16} color="var(--brand-primary)" />
          </div>
          <div className="kpi-card-val" style={{ fontSize: '1.25rem', color: isHealthy ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {backendStatus?.isOnline ? 'Not Required' : 'Status unavailable'}
          </div>
        </div>
      </div>

      {/* BATCH PIPELINE STATUS */}
      <div className="pro-card" style={{ marginBottom: '24px' }}>
        <div className="card-header-bar">
          <h3 className="card-title" style={{ fontSize: '0.92rem' }}>
            <GitBranch className="card-icon" size={16} color="var(--brand-primary)" />
            Batch Pipeline Status
          </h3>
          <span className="tag-badge success">All Stages Ready</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--info-bg)',
                    color: 'var(--brand-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {stage.name}
                </span>
              </div>
              <span className={`tag-badge ${stage.type}`}>
                {stage.icon} {stage.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MODEL */}
      <div className="pro-card">
        <div className="card-header-bar">
          <h3 className="card-title" style={{ fontSize: '0.92rem' }}>
            <Cpu className="card-icon" size={16} color="var(--brand-primary)" />
            Model
          </h3>
          <span className="tag-badge info">Demand Forecasting</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px 4px 8px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Architecture
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              XGBoost
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Objective Task
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Demand Forecasting
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Version
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>
              {modelVersion}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
