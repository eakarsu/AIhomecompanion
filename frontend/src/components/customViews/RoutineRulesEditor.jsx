import React, { useEffect, useState } from 'react';

const emptyRule = () => ({
  name: '',
  enabled: true,
  triggers: [{ type: 'time', value: '' }],
  actions: [{ type: 'device', target: '', value: '' }],
});

export default function RoutineRulesEditor() {
  const [rules, setRules] = useState([]);
  const [triggerTypes, setTriggerTypes] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [draft, setDraft] = useState(emptyRule());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const load = () => {
    setLoading(true);
    fetch('/api/custom-views/routine-rules', { headers: authHeaders() })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Failed');
        setRules(d.rules);
        setTriggerTypes(d.trigger_types);
        setActionTypes(d.action_types);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const saveRule = async () => {
    setError('');
    try {
      const url = editingId
        ? `/api/custom-views/routine-rules/${editingId}`
        : '/api/custom-views/routine-rules';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(draft),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Save failed');
      setDraft(emptyRule());
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const editRule = (rule) => {
    setEditingId(rule.id);
    setDraft({
      name: rule.name,
      enabled: rule.enabled,
      triggers: rule.triggers.length ? rule.triggers : [{ type: 'time', value: '' }],
      actions: rule.actions.length ? rule.actions : [{ type: 'device', target: '', value: '' }],
    });
  };

  const deleteRule = async (id) => {
    if (!confirm('Delete this routine?')) return;
    const res = await fetch(`/api/custom-views/routine-rules/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) load();
  };

  const updateTrigger = (i, field, v) => {
    const next = [...draft.triggers];
    next[i] = { ...next[i], [field]: v };
    setDraft({ ...draft, triggers: next });
  };
  const addTrigger = () =>
    setDraft({ ...draft, triggers: [...draft.triggers, { type: 'time', value: '' }] });
  const removeTrigger = (i) =>
    setDraft({ ...draft, triggers: draft.triggers.filter((_, idx) => idx !== i) });

  const updateAction = (i, field, v) => {
    const next = [...draft.actions];
    next[i] = { ...next[i], [field]: v };
    setDraft({ ...draft, actions: next });
  };
  const addAction = () =>
    setDraft({ ...draft, actions: [...draft.actions, { type: 'device', target: '', value: '' }] });
  const removeAction = (i) =>
    setDraft({ ...draft, actions: draft.actions.filter((_, idx) => idx !== i) });

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <h3 style={{ margin: '0 0 4px' }}>Routine / Automation Rules Editor</h3>
      <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>
        CRUD editor for routines with multiple triggers and actions.
      </p>
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 6, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, marginBottom: 16, background: '#f8fafc' }}>
        <strong>{editingId ? `Editing Rule #${editingId}` : 'New Rule'}</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Rule name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            style={{ flex: '1 1 240px', padding: 6, border: '1px solid #cbd5e1', borderRadius: 4 }}
          />
          <label style={{ fontSize: 13 }}>
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            />{' '}
            Enabled
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Triggers</div>
          {draft.triggers.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <select
                value={t.type}
                onChange={(e) => updateTrigger(i, 'type', e.target.value)}
                style={{ padding: 4, border: '1px solid #cbd5e1', borderRadius: 4 }}
              >
                {triggerTypes.map(tt => <option key={tt} value={tt}>{tt}</option>)}
              </select>
              <input
                placeholder="value"
                value={t.value || ''}
                onChange={(e) => updateTrigger(i, 'value', e.target.value)}
                style={{ flex: 1, padding: 4, border: '1px solid #cbd5e1', borderRadius: 4 }}
              />
              <button onClick={() => removeTrigger(i)} style={{ padding: '2px 8px' }}>×</button>
            </div>
          ))}
          <button onClick={addTrigger} style={{ padding: '4px 8px', fontSize: 12 }}>+ Add Trigger</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Actions</div>
          {draft.actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <select
                value={a.type}
                onChange={(e) => updateAction(i, 'type', e.target.value)}
                style={{ padding: 4, border: '1px solid #cbd5e1', borderRadius: 4 }}
              >
                {actionTypes.map(tt => <option key={tt} value={tt}>{tt}</option>)}
              </select>
              <input
                placeholder="target"
                value={a.target || ''}
                onChange={(e) => updateAction(i, 'target', e.target.value)}
                style={{ flex: 1, padding: 4, border: '1px solid #cbd5e1', borderRadius: 4 }}
              />
              <input
                placeholder="value"
                value={a.value || ''}
                onChange={(e) => updateAction(i, 'value', e.target.value)}
                style={{ flex: 1, padding: 4, border: '1px solid #cbd5e1', borderRadius: 4 }}
              />
              <button onClick={() => removeAction(i)} style={{ padding: '2px 8px' }}>×</button>
            </div>
          ))}
          <button onClick={addAction} style={{ padding: '4px 8px', fontSize: 12 }}>+ Add Action</button>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={saveRule}
            style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}
          >
            {editingId ? 'Update Rule' : 'Create Rule'}
          </button>
          {editingId && (
            <button
              onClick={() => { setEditingId(null); setDraft(emptyRule()); }}
              style={{ padding: '6px 14px' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div>
        <strong>Existing Rules ({rules.length})</strong>
        {loading ? (
          <div style={{ padding: 8 }}>Loading...</div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {rules.map(rule => (
              <div key={rule.id} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <strong>{rule.name}</strong>
                    <span style={{
                      marginLeft: 8,
                      fontSize: 11,
                      padding: '2px 6px',
                      background: rule.enabled ? '#dcfce7' : '#fee2e2',
                      color: rule.enabled ? '#15803d' : '#991b1b',
                      borderRadius: 4,
                    }}>
                      {rule.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => editRule(rule)} style={{ padding: '2px 8px', fontSize: 12 }}>Edit</button>
                    <button onClick={() => deleteRule(rule.id)} style={{ padding: '2px 8px', fontSize: 12, color: '#b91c1c' }}>Delete</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  <div><strong>Triggers:</strong> {rule.triggers.map(t => `${t.type}=${t.value}`).join(' • ')}</div>
                  <div><strong>Actions:</strong> {rule.actions.map(a => `${a.type}:${a.target}→${a.value}`).join(' • ')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
