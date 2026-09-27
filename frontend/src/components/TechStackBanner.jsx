import React from 'react';
import { Layers, Server, Cpu, Database, Activity, Box, ShieldCheck } from 'lucide-react';
import { TECH_STACK } from '../data/presets';

export default function TechStackBanner() {
  return (
    <div className="pro-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="var(--brand-primary)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            System Architecture &amp; Production Technology Stack
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
          React.js &rarr; FastAPI &rarr; PostgreSQL / DVC &rarr; XGBoost &amp; SciPy / OR-Tools
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {TECH_STACK.map((tech) => (
          <div
            key={tech.name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.74rem',
            }}
            title={`${tech.name} (${tech.version}) - ${tech.role}`}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tech.name}</span>
            <span style={{ color: 'var(--brand-accent)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>{tech.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
