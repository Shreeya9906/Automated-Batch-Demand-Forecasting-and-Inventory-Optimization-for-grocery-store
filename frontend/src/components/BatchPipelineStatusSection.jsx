import React from 'react';
import { 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';
import { PIPELINE_STAGES } from '../data/presets';

export default function BatchPipelineStatusSection() {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="tag-badge success">&check; Completed</span>;
      case 'warning':
        return <span className="tag-badge warning">&warning; Warning</span>;
      case 'failed':
        return <span className="tag-badge danger">&times; Failed</span>;
      default:
        return <span className="tag-badge info">&#9675; Standby</span>;
    }
  };

  return (
    <div className="pro-card" style={{ marginBottom: '24px' }}>
      <div className="card-header-bar">
        <div>
          <h3 className="card-title">
            <GitBranch className="card-icon" size={17} style={{ color: 'var(--brand-primary)' }} />
            Automated MLOps Batch Pipeline Status
          </h3>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
            Scheduled retail batch pipeline execution graph: Retail Data &rarr; Validation &rarr; Features &rarr; Forecast &rarr; Optimization &rarr; Drift
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Airflow Orchestrator:</span>
          <span className="tag-badge info" title="Airflow webserver daemon is in standby mode for local development">
            Standby / Scheduled Batch DAG
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
        {PIPELINE_STAGES.map((stage, idx) => (
          <div
            key={stage.id}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                  0{idx + 1}
                </span>
                {getStatusBadge(stage.status)}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '4px' }}>
                {stage.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                {stage.tool}
              </div>
            </div>

            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
              {stage.timestamp}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
