import React, { useContext, useState } from 'react';
import { AppContext } from '../App';

function renderAIText(text) {
  if (!text) return null;
  const lines = String(text).split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('### ')) return <h4 key={i} style={{ color: '#a78bfa', margin: '12px 0 6px', fontSize: 14, fontWeight: 600 }}>{line.slice(4)}</h4>;
    if (line.startsWith('## ')) return <h3 key={i} style={{ color: '#60a5fa', margin: '16px 0 8px', fontSize: 16, fontWeight: 600 }}>{line.slice(3)}</h3>;
    if (line.startsWith('# ')) return <h2 key={i} style={{ color: '#60a5fa', margin: '16px 0 8px', fontSize: 18, fontWeight: 700 }}>{line.slice(2)}</h2>;
    if (line.match(/^[-*•]\s/)) return (
      <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0', paddingLeft: 8 }}>
        <span style={{ color: '#3b82f6', flexShrink: 0 }}>•</span>
        <span>{line.slice(2)}</span>
      </div>
    );
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
    return <p key={i} style={{ padding: '2px 0', lineHeight: 1.7 }}>{line}</p>;
  });
}

const TOOLS = [
  {
    key: 'expense-optimizer',
    label: 'Expense Optimizer',
    icon: '💸',
    description: 'Recommends cost-saving automations and unused-service cancellations using your budget, energy logs, and devices.',
    fields: [],
  },
  {
    key: 'occupancy-prediction',
    label: 'Occupancy Prediction',
    icon: '👥',
    description: 'Predicts per-room occupancy probability and recommends HVAC/lighting/standby actions.',
    fields: [
      { name: 'lookahead_hours', label: 'Lookahead (hours)', type: 'number', defaultValue: 24 },
    ],
  },
  {
    key: 'routine-learning',
    label: 'Routine Learning',
    icon: '🧠',
    description: 'Detects recurring family patterns and proposes new automations with confidence scores.',
    fields: [],
  },
  {
    key: 'proactive-maintenance',
    label: 'Proactive Maintenance',
    icon: '🛠️',
    description: 'Builds a prioritized maintenance plan from predictive failures, past logs, devices, and warranties.',
    fields: [
      { name: 'lookahead_days', label: 'Lookahead (days)', type: 'number', defaultValue: 30 },
    ],
  },
  // Apply pass 5
  {
    key: 'guest-profiling',
    label: 'Guest Profiling',
    icon: '🛎️',
    description: 'Advisory profile of guest preferences from visit history. Privacy-respecting; you decide what to apply.',
    fields: [
      { name: 'guest_id', label: 'Guest ID (optional)', type: 'number', defaultValue: '' },
    ],
  },
  {
    key: 'emergency-response-advisor',
    label: 'Emergency Response Advisor',
    icon: '🚨',
    description: 'ADVISORY playbook only. Always call emergency services first. Does NOT execute device controls.',
    fields: [
      { name: 'emergency_type', label: 'Emergency Type *', type: 'text', defaultValue: 'fire' },
      { name: 'severity', label: 'Severity', type: 'text', defaultValue: 'unknown' },
    ],
  },
];

export default function AdvancedAITools() {
  const { token, API } = useContext(AppContext);
  const [tool, setTool] = useState(TOOLS[0]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const switchTool = (t) => {
    setTool(t);
    const init = {};
    (t.fields || []).forEach((f) => { init[f.name] = f.defaultValue ?? ''; });
    setFormData(init);
    setResult(null);
    setError(null);
  };

  const setField = (name, value) => setFormData((p) => ({ ...p, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const body = {};
      (tool.fields || []).forEach((f) => {
        if (formData[f.name] === '' || formData[f.name] === undefined || formData[f.name] === null) return;
        body[f.name] = f.type === 'number' ? Number(formData[f.name]) : formData[f.name];
      });
      const res = await fetch(`${API}/ai/${tool.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || `Request failed (${res.status})`);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const extractContent = (data) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.analysis || data.recommendation || data.recommendations || data.prediction || data.predictions || data.report || data.suggestions || data.result || data.plan || data.detected_routines || JSON.stringify(data, null, 2);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🤖 Advanced AI Tools</h2>
          <p>Expense optimization, occupancy prediction, and routine learning</p>
        </div>
      </div>

      <div className="ai-buttons" style={{ marginBottom: 16 }}>
        {TOOLS.map((t) => (
          <button
            key={t.key}
            className="btn-primary"
            onClick={() => switchTool(t)}
            style={{ opacity: tool.key === t.key ? 1 : 0.6 }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="ai-output-card">
        <div className="ai-badge">
          <span>{tool.icon}</span>
          <span>{tool.label}</span>
        </div>
        <p style={{ color: '#94a3b8', marginBottom: 12 }}>{tool.description}</p>

        <form onSubmit={submit}>
          {(tool.fields || []).map((f) => (
            <div key={f.name} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontSize: 13 }}>{f.label}</label>
              <input
                type={f.type || 'text'}
                value={formData[f.name] ?? ''}
                onChange={(e) => setField(f.name, e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9' }}
              />
            </div>
          ))}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }}></span>Running...</>
            ) : 'Run'}
          </button>
        </form>
      </div>

      {error && (
        <div className="ai-output-card" style={{ marginTop: 16, borderLeft: '3px solid #ef4444' }}>
          <div className="ai-badge"><span>⚠️</span><span>Error</span></div>
          <div className="ai-text" style={{ color: '#fca5a5' }}>{error}</div>
        </div>
      )}

      {result && (
        <div className="ai-output-card" style={{ marginTop: 16 }}>
          <div className="ai-badge"><span>🤖</span><span>{tool.label} — Result</span></div>
          <div className="ai-text">{renderAIText(extractContent(result))}</div>
          <div className="ai-meta">
            {result.model && <span>Model: {result.model}</span>}
            {result.tokens_used && <span>Tokens: {result.tokens_used}</span>}
            {result.timestamp && <span>Generated: {new Date(result.timestamp).toLocaleString()}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
