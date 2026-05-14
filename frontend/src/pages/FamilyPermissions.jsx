// Apply pass 5 page — manages /api/family-permissions (additive non-AI feature).
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';

export default function FamilyPermissions() {
  const { token, API } = useContext(AppContext);
  const [members, setMembers] = useState([]);
  const [allowedScopes, setAllowedScopes] = useState([]);
  const [form, setForm] = useState({ member_email: '', display_name: '', role: 'member', scopes: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = async () => {
    setError('');
    try {
      const r = await fetch(`${API}/family-permissions`, { headers });
      if (!r.ok) throw new Error((await r.json()).error || 'load failed');
      setMembers(await r.json());
      const s = await fetch(`${API}/family-permissions/scopes/allowed`, { headers });
      if (s.ok) setAllowedScopes((await s.json()).scopes || []);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/family-permissions`, { method: 'POST', headers, body: JSON.stringify(form) });
      if (!r.ok) throw new Error((await r.json()).error || 'create failed');
      setForm({ member_email: '', display_name: '', role: 'member', scopes: [] });
      await load();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const remove = async (id) => {
    try {
      await fetch(`${API}/family-permissions/${id}`, { method: 'DELETE', headers });
      await load();
    } catch (e) { setError(e.message); }
  };

  const toggleScope = (scope) => {
    setForm(f => ({
      ...f,
      scopes: f.scopes.includes(scope) ? f.scopes.filter(s => s !== scope) : [...f.scopes, scope],
    }));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>👨‍👩‍👧 Family Permissions (Pass 5)</h2>
      <p style={{ color: '#666' }}>Share controlled access to household features with family members. All access is scope-gated.</p>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      <form onSubmit={submit} style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', maxWidth: 700, margin: '12px 0' }}>
        <input placeholder="Member email" value={form.member_email} onChange={e => setForm({ ...form, member_email: e.target.value })} />
        <input placeholder="Display name" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} />
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="guest">Guest</option>
          <option value="child">Child</option>
        </select>
        <div style={{ gridColumn: '1 / span 2' }}>
          <strong>Scopes:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {allowedScopes.map(s => (
              <label key={s} style={{ background: form.scopes.includes(s) ? '#cfe' : '#eee', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.scopes.includes(s)} onChange={() => toggleScope(s)} style={{ marginRight: 4 }} />
                {s}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ gridColumn: '1 / span 2' }}>{loading ? 'Saving…' : 'Add / Update Member'}</button>
      </form>

      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead><tr><th>ID</th><th>Email</th><th>Name</th><th>Role</th><th>Scopes</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {members.map(m => (
            <tr key={m.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{m.id}</td><td>{m.member_email}</td><td>{m.display_name}</td><td>{m.role}</td>
              <td style={{ fontSize: 11, maxWidth: 320 }}>{(m.scopes || []).join(', ')}</td>
              <td>{m.status}</td>
              <td><button onClick={() => remove(m.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
