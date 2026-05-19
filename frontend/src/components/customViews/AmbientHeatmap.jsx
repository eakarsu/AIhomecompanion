import React, { useEffect, useState } from 'react';

const metricColors = {
  temperature: [251, 113, 133],
  humidity: [56, 189, 248],
  light: [250, 204, 21],
};

export default function AmbientHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/ambient-heatmap', {
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

  if (loading) return <div style={{ padding: 12 }}>Loading ambient heatmap...</div>;
  if (error) return <div style={{ padding: 12, color: '#b91c1c' }}>Error: {error}</div>;
  if (!data) return null;

  const cellAt = (roomId, metric) =>
    data.cells.find(c => c.room_id === roomId && c.metric === metric);

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
      <h3 style={{ margin: '0 0 4px' }}>Ambient Sensor Heatmap</h3>
      <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
        {data.rooms.length} rooms × {data.metrics.length} metrics ·{' '}
        {new Date(data.generated_at).toLocaleTimeString()}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Room</th>
            {data.metrics.map(m => (
              <th key={m} style={{ textAlign: 'center', padding: 8, borderBottom: '1px solid #e2e8f0', textTransform: 'capitalize' }}>
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rooms.map(room => (
            <tr key={room.id}>
              <td style={{ padding: 8, fontWeight: 600 }}>{room.name}</td>
              {data.metrics.map(metric => {
                const cell = cellAt(room.id, metric);
                if (!cell) return <td key={metric} />;
                const [r, g, b] = metricColors[metric] || [148, 163, 184];
                const bg = `rgba(${r}, ${g}, ${b}, ${0.15 + cell.intensity * 0.7})`;
                return (
                  <td key={metric} style={{ padding: 4 }}>
                    <div
                      style={{
                        background: bg,
                        padding: '10px 8px',
                        borderRadius: 6,
                        textAlign: 'center',
                        color: cell.intensity > 0.5 ? '#fff' : '#0f172a',
                        fontWeight: 600,
                      }}
                      title={`${room.name} ${metric}: ${cell.value} ${cell.unit}`}
                    >
                      {cell.value} {cell.unit}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
