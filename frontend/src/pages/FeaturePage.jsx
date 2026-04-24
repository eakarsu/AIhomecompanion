import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../App';

function getBadgeClass(value) {
  if (value === null || value === undefined) return '';
  const v = String(value).toLowerCase().replace(/\s+/g, '_');
  const map = {
    'online': 'badge-online', 'offline': 'badge-offline', 'standby': 'badge-warning',
    'normal': 'badge-normal', 'good': 'badge-good', 'warning': 'badge-warning', 'moderate': 'badge-moderate',
    'critical': 'badge-critical', 'error': 'badge-error',
    'low': 'badge-low', 'medium': 'badge-medium', 'high': 'badge-high',
    'completed': 'badge-completed', 'pending': 'badge-pending', 'scheduled': 'badge-scheduled',
    'in_progress': 'badge-in_progress', 'accepted': 'badge-accepted',
    'easy': 'badge-easy', 'hard': 'badge-hard',
    'success': 'badge-success', 'info': 'badge-info',
    'true': 'badge-online', 'false': 'badge-offline',
    'up': 'badge-online', 'down': 'badge-offline', 'stable': 'badge-info',
    // Home Life statuses
    'healthy': 'badge-online', 'needs_attention': 'badge-warning', 'wilting': 'badge-error', 'dormant': 'badge-info',
    'in_stock': 'badge-online', 'low_stock': 'badge-warning', 'out_of_stock': 'badge-error', 'expired': 'badge-critical',
    'ordered': 'badge-info', 'shipped': 'badge-pending', 'in_transit': 'badge-scheduled', 'out_for_delivery': 'badge-warning', 'delivered': 'badge-completed', 'returned': 'badge-error',
    'expected': 'badge-info', 'checked_in': 'badge-online', 'checked_out': 'badge-offline',
    'playing': 'badge-online', 'paused': 'badge-warning', 'stopped': 'badge-offline',
    'washing': 'badge-in_progress', 'drying': 'badge-scheduled', 'done': 'badge-completed', 'folded': 'badge-accepted',
    'active': 'badge-online', 'claimed': 'badge-warning', 'cancelled': 'badge-error',
    'expense': 'badge-error', 'income': 'badge-online', 'budget': 'badge-info',
    // Robot AI statuses
    'idle': 'badge-info', 'charging': 'badge-warning', 'cleaning': 'badge-in_progress', 'patrolling': 'badge-scheduled',
    'queued': 'badge-pending', 'failed': 'badge-error',
    'processed': 'badge-completed', 'recognized': 'badge-online', 'unrecognized': 'badge-error',
    'navigating': 'badge-in_progress',
    'predicted': 'badge-info', 'monitoring': 'badge-warning', 'action_needed': 'badge-error',
    'planned': 'badge-info', 'prepared': 'badge-completed', 'skipped': 'badge-offline',
  };
  return map[v] || '';
}

function formatValue(key, value) {
  if (value === null || value === undefined) return '-';
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (key === 'cost' || key === 'cost_usd' || key === 'potential_savings' || key === 'amount' || key === 'estimated_price' || key === 'coverage_amount' || key === 'premium' || key === 'deductible' || key === 'estimated_cost') return `$${Number(value).toFixed(2)}`;
  if (key === 'ai_confidence' || key === 'confidence' || key === 'failure_probability') return `${(Number(value) * 100).toFixed(0)}%`;
  if (key === 'change_percent') return `${value > 0 ? '+' : ''}${value}%`;
  if (key === 'created_at' || key === 'last_active' || key === 'last_seen' || key === 'last_reading' || key === 'next_run' || key === 'last_run' || key === 'resolved_at' || key === 'started_at' || key === 'completed_at' || key === 'estimated_done' || key === 'last_charged' || key === 'scheduled_at') {
    return value ? new Date(value).toLocaleString() : '-';
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const badgeColumns = ['status', 'severity', 'priority', 'is_active', 'is_resolved', 'is_read', 'is_home', 'occupancy', 'trend', 'difficulty', 'efficiency_rating', 'type', 'is_purchased', 'wifi_access', 'is_anomaly', 'is_recognized', 'access_granted', 'ai_suggested', 'is_favorite', 'is_recurring', 'is_all_day', 'health_status', 'media_type'];

export default function FeaturePage({ feature, title, icon, columns, fields }) {
  const { token, API } = useContext(AppContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/${feature}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [feature]);

  const handleRowClick = (item) => setSelectedItem(item);

  const handleNew = () => {
    setEditItem(null);
    setFormData({});
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    const data = {};
    fields.forEach(f => {
      let val = item[f.name];
      if (typeof val === 'boolean') val = String(val);
      if (val !== null && val !== undefined) data[f.name] = val;
    });
    setFormData(data);
    setSelectedItem(null);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name || item.title || item.device_name || item.metric_name || item.meal_name || item.item_name || item.task_name || item.person_name || item.object_name || item.gesture_name || item.robot_name || item.command_text || item.label || item.description || item.person || item.destination || 'this item'}"?`)) return;
    try {
      await fetch(`${API}/${feature}/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setSelectedItem(null);
      fetchItems();
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editItem ? 'PUT' : 'POST';
    const url = editItem ? `${API}/${feature}/${editItem.id}` : `${API}/${feature}`;
    const body = { ...formData };
    // Convert string booleans
    Object.keys(body).forEach(k => {
      if (body[k] === 'true') body[k] = true;
      if (body[k] === 'false') body[k] = false;
    });
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowForm(false);
      fetchItems();
    } catch (err) { alert('Error: ' + err.message); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Loading {title}...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{icon} {title}</h2>
          <p>{items.length} items</p>
        </div>
        <button className="btn-primary" onClick={handleNew}>+ New {title.replace(/s$/, '')}</button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col === 'icon' || col === 'avatar' ? '' : col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                {columns.map(col => (
                  <td key={col} className={col === 'icon' || col === 'avatar' ? 'icon-cell' : ''}>
                    {badgeColumns.includes(col) && item[col] !== null && item[col] !== undefined ? (
                      <span className={`badge ${getBadgeClass(item[col])}`}>{formatValue(col, item[col])}</span>
                    ) : (
                      formatValue(col, item[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No items yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem.icon || selectedItem.avatar || icon} {selectedItem.name || selectedItem.title || selectedItem.device_name || selectedItem.metric_name || selectedItem.meal_name || selectedItem.item_name || selectedItem.task_name || selectedItem.person_name || selectedItem.object_name || selectedItem.gesture_name || selectedItem.robot_name || selectedItem.label || selectedItem.description || selectedItem.person || selectedItem.destination || 'Details'}</h3>
              <button className="modal-close" onClick={() => setSelectedItem(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {Object.entries(selectedItem).filter(([k]) => k !== 'id').map(([key, value]) => (
                <div className="detail-row" key={key}>
                  <div className="detail-label">{key.replace(/_/g, ' ')}</div>
                  <div className="detail-value">
                    {badgeColumns.includes(key) && value !== null ? (
                      <span className={`badge ${getBadgeClass(value)}`}>{formatValue(key, value)}</span>
                    ) : (
                      formatValue(key, value)
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => handleEdit(selectedItem)}>Edit</button>
              <button className="btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit' : 'New'} {title.replace(/s$/, '')}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  {fields.map(field => (
                    <div className={`form-group ${field.fullWidth ? 'full-width' : ''}`} key={field.name}>
                      <label>{field.label} {field.required && '*'}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.name] || ''}
                          onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                          required={field.required}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.name] || ''}
                          onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                        >
                          <option value="">Select...</option>
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={formData[field.name] || ''}
                          onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
