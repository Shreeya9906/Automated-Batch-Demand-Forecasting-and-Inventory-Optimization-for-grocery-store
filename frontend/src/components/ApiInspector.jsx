import React, { useState } from 'react';
import { FileCode, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { PRESETS } from '../data/presets';

export default function ApiInspector({ formData }) {
  const [copiedType, setCopiedType] = useState(null);

  const predictPayload = {
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
  };

  const optimizePayload = {
    ...predictPayload,
    "Warehouse_ID": formData["Warehouse_ID"] || "WH_1",
    "SKU_ID": formData["SKU_ID"] || "SKU_1",
    "Inventory_Level": parseFloat(formData["Inventory_Level"]) || 0,
    "Reorder_Point": parseFloat(formData["Reorder_Point"]) || 0,
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const curlPredict = `curl -X POST "http://localhost:8000/predict" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(predictPayload)}'`;

  const curlOptimize = `curl -X POST "http://localhost:8000/optimize" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(optimizePayload)}'`;

  return (
    <div className="section-container" role="tabpanel">
      <div className="section-title-bar" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">
            <FileCode className="section-icon" size={20} />
            API Contract & Integration Inspector
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Inspect exact JSON payloads, cURL equivalents, and FastAPI schema contracts as defined in <code>docs/api-contract.md</code>.
          </p>
        </div>

        <a 
          href="http://localhost:8000/docs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="submit-btn"
          style={{ width: 'auto', padding: '10px 18px', margin: 0, textDecoration: 'none' }}
        >
          <span>Open Swagger UI</span>
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="workspace-grid">
        {/* Predict Payload */}
        <div className="glass-panel form-card">
          <div className="section-title-bar">
            <h3 className="section-title" style={{ fontSize: '1rem' }}>
              POST /predict
            </h3>
            <button
              className="preset-chip"
              style={{ padding: '4px 10px' }}
              onClick={() => copyToClipboard(JSON.stringify(predictPayload, null, 2), 'predict-json')}
            >
              {copiedType === 'predict-json' ? <Check size={14} color="var(--emerald-400)" /> : <Copy size={14} />}
              <span>{copiedType === 'predict-json' ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre style={{ background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#6ee7b7', overflowX: 'auto', maxHeight: '320px' }}>
            {JSON.stringify(predictPayload, null, 2)}
          </pre>

          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                cURL Command
              </span>
              <button
                className="preset-chip"
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                onClick={() => copyToClipboard(curlPredict, 'predict-curl')}
              >
                {copiedType === 'predict-curl' ? <Check size={12} color="var(--emerald-400)" /> : <Copy size={12} />}
                <span>{copiedType === 'predict-curl' ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre style={{ background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#93c5fd', overflowX: 'auto' }}>
              {curlPredict}
            </pre>
          </div>
        </div>

        {/* Optimize Payload */}
        <div className="glass-panel form-card">
          <div className="section-title-bar">
            <h3 className="section-title" style={{ fontSize: '1rem' }}>
              POST /optimize
            </h3>
            <button
              className="preset-chip"
              style={{ padding: '4px 10px' }}
              onClick={() => copyToClipboard(JSON.stringify(optimizePayload, null, 2), 'opt-json')}
            >
              {copiedType === 'opt-json' ? <Check size={14} color="var(--emerald-400)" /> : <Copy size={14} />}
              <span>{copiedType === 'opt-json' ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre style={{ background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#6ee7b7', overflowX: 'auto', maxHeight: '320px' }}>
            {JSON.stringify(optimizePayload, null, 2)}
          </pre>

          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                cURL Command
              </span>
              <button
                className="preset-chip"
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                onClick={() => copyToClipboard(curlOptimize, 'opt-curl')}
              >
                {copiedType === 'opt-curl' ? <Check size={12} color="var(--emerald-400)" /> : <Copy size={12} />}
                <span>{copiedType === 'opt-curl' ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre style={{ background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#93c5fd', overflowX: 'auto' }}>
              {curlOptimize}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
