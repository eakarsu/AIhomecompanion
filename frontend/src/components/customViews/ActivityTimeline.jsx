import React, { useEffect, useState } from 'react';

export default function ActivityTimeline() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/activity-timeline', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Failed');
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 12 }}>Loading activity timeline...</div>;
  if (error) return <div style={{ padding: 12, color: '#b91c1c' }}>Error: {error}</div>;
  if (!data) return null;

  const maxCount = Math.max(1, ...data.timeline.flatMap(row => row.hours));

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <h3 style={{ margin: '0 0 4px' }}>Activity Timeline</h3>
      <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
        {data.date} · {data.total_events} events · {data.devices} devices · {data.rooms} rooms
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', position: 'sticky', left: 0, background: '#fff' }}>Device / Room</th>
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} style={{ padding: '4px 2px', minWidth: 22, color: '#64748b', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.timeline.map(row => (
              <tr key={row.device_id}>
                <td style={{ padding: '4px 8px', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#fff' }}>
                  <div style={{ fontWeight: 600 }}>{row.device_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.room_name}</div>
                </td>
                {row.hours.map((c, h) => {
                  const intensity = c / maxCount;
                  return (
                    <td key={h} style={{ padding: 1 }}>
                      <div
                        title={`Hour ${h}: ${c} events`}
                        style={{
                          width: 20,
                          height: 22,
                          background: c === 0 ? '#f1f5f9' : `rgba(37, 99, 235, ${0.15 + intensity * 0.75})`,
                          borderRadius: 3,
                          color: '#fff',
                          textAlign: 'center',
                          lineHeight: '22px',
                          fontSize: 10,
                        }}
                      >
                        {c > 0 ? c : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
