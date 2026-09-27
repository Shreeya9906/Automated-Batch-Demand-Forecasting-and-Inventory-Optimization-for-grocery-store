import React from 'react';
import { 
  GitBranch, 
  Cpu, 
  ArrowRight
} from 'lucide-react';
import { PIPELINE_STAGES } from '../data/presets';

export default function PipelineStatusView({ backendStatus }) {
  return (
    <div className="section-container" role="tabpanel">
      {/* Title Header */}
      <div className="card-header-bar" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="card-title">
            <GitBranch className="card-icon" size={18} color="var(--brand-primary)" />
            Automated MLOps Batch Pipeline Status
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Multi-stage scheduled production pipeline orchestrated via Apache Airflow, DVC, Great Expectations, and Docker.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="tag-badge success">
            Pipeline: Active
          </span>
        </div>
      </div>

      {/* High-Level Architecture Flow */}
      <div className="flow-pipeline-banner" style={{ marginBottom: '24px' }}>
        {PIPELINE_STAGES.map((stage, idx) => (
          <React.Fragment key={stage.id}>
            <div className="flow-step-item">
              <div className="flow-step-num">{idx + 1}</div>
              <div className="flow-step-info">
                <h4>{stage.name}</h4>
                <p>✓ Completed</p>
              </div>
            </div>
            {idx < PIPELINE_STAGES.length - 1 && (
              <ArrowRight size={16} className="flow-arrow-separator" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Detailed Stage Execution Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {PIPELINE_STAGES.map((stage, idx) => (
          <div key={stage.id} className="pro-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                Stage 0{idx + 1}
              </span>
              <span className="tag-badge success">
                ✓ Completed
              </span>
            </div>

            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {stage.name}
            </h3>

            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '12px' }}>
              {stage.details}
            </p>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Execution:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{stage.timestamp}</strong>
            </div>
          </div>
        ))}
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
              Task Objective
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
              v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
