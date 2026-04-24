import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';

const featureGroups = [
  { group: 'Smart Home', items: [
    { key: 'devices', path: '/devices', icon: '📱', label: 'Smart Devices', desc: 'Manage all connected devices', endpoint: 'devices' },
    { key: 'rooms', path: '/rooms', icon: '🏡', label: 'Rooms', desc: 'Configure your home rooms', endpoint: 'rooms' },
    { key: 'automations', path: '/automations', icon: '⚡', label: 'Automations', desc: 'Smart automation rules', endpoint: 'automations' },
    { key: 'scenes', path: '/scenes', icon: '🎬', label: 'Scenes', desc: 'Lighting & mood presets', endpoint: 'scenes' },
    { key: 'energy', path: '/energy', icon: '💡', label: 'Energy Monitor', desc: 'Track energy consumption', endpoint: 'energy' },
    { key: 'security', path: '/security', icon: '🔒', label: 'Security', desc: 'Security alerts & cameras', endpoint: 'security' },
    { key: 'sensors', path: '/sensors', icon: '📡', label: 'Sensors', desc: 'Environmental monitoring', endpoint: 'sensors' },
    { key: 'schedules', path: '/schedules', icon: '⏰', label: 'Schedules', desc: 'Scheduled automations', endpoint: 'schedules' },
    { key: 'notifications', path: '/notifications', icon: '🔔', label: 'Notifications', desc: 'System notifications', endpoint: 'notifications' },
    { key: 'maintenance', path: '/maintenance', icon: '🔧', label: 'Maintenance', desc: 'Device maintenance logs', endpoint: 'maintenance' },
    { key: 'analytics', path: '/analytics', icon: '📊', label: 'Analytics', desc: 'Usage analytics & trends', endpoint: 'analytics' },
  ]},
  { group: 'Home Life', items: [
    { key: 'profiles', path: '/profiles', icon: '👨‍👩‍👧‍👦', label: 'Family Profiles', desc: 'Household members', endpoint: 'profiles' },
    { key: 'calendar', path: '/calendar', icon: '📅', label: 'Family Calendar', desc: 'Events & appointments', endpoint: 'calendar' },
    { key: 'shopping', path: '/shopping', icon: '🛒', label: 'Shopping List', desc: 'Grocery & shopping', endpoint: 'shopping' },
    { key: 'recipes', path: '/recipes', icon: '🍳', label: 'Recipes', desc: 'Recipe collection', endpoint: 'recipes' },
    { key: 'mealplan', path: '/mealplan', icon: '🍽️', label: 'Meal Planning', desc: 'AI meal planning', endpoint: 'mealplan' },
    { key: 'chores', path: '/chores', icon: '✅', label: 'Chores', desc: 'Household tasks', endpoint: 'chores' },
    { key: 'budget', path: '/budget', icon: '💰', label: 'Budget', desc: 'Home budget & expenses', endpoint: 'budget' },
    { key: 'inventory', path: '/inventory', icon: '🥫', label: 'Pantry', desc: 'Inventory tracking', endpoint: 'inventory' },
    { key: 'weather', path: '/weather', icon: '🌤️', label: 'Weather', desc: 'Local weather & forecasts', endpoint: 'weather' },
    { key: 'pets', path: '/pets', icon: '🐾', label: 'Pet Care', desc: 'Pet health & schedules', endpoint: 'pets' },
    { key: 'plants', path: '/plants', icon: '🌱', label: 'Plants', desc: 'Garden & plant care', endpoint: 'plants' },
    { key: 'guests', path: '/guests', icon: '🏠', label: 'Guests', desc: 'Guest visit management', endpoint: 'guests' },
    { key: 'media', path: '/media', icon: '🎵', label: 'Media', desc: 'Music & media control', endpoint: 'media' },
    { key: 'laundry', path: '/laundry', icon: '👕', label: 'Laundry', desc: 'Laundry load tracking', endpoint: 'laundry' },
    { key: 'packages', path: '/packages', icon: '📦', label: 'Packages', desc: 'Delivery tracking', endpoint: 'packages' },
    { key: 'warranty', path: '/warranty', icon: '📋', label: 'Warranty', desc: 'Warranty & insurance', endpoint: 'warranty' },
    { key: 'emergency', path: '/emergency', icon: '🚨', label: 'Emergency', desc: 'Emergency contacts', endpoint: 'emergency' },
    { key: 'intercom', path: '/intercom', icon: '📢', label: 'Intercom', desc: 'Room-to-room messaging', endpoint: 'intercom' },
  ]},
  { group: 'Robot AI', items: [
    { key: 'robotstatus', path: '/robotstatus', icon: '🤖', label: 'Robot Status', desc: 'Robot health & battery', endpoint: 'robotstatus' },
    { key: 'robottasks', path: '/robottasks', icon: '📋', label: 'Robot Tasks', desc: 'Task queue management', endpoint: 'robottasks' },
    { key: 'voice', path: '/voice', icon: '🎤', label: 'Voice Commands', desc: 'Voice command history', endpoint: 'voice' },
    { key: 'faces', path: '/faces', icon: '👤', label: 'Face Recognition', desc: 'Facial recognition logs', endpoint: 'faces' },
    { key: 'emotions', path: '/emotions', icon: '😊', label: 'Emotions', desc: 'Emotion detection', endpoint: 'emotions' },
    { key: 'gestures', path: '/gestures', icon: '🤚', label: 'Gestures', desc: 'Gesture recognition', endpoint: 'gestures' },
    { key: 'objects', path: '/objects', icon: '🔍', label: 'Object Detection', desc: 'Detected objects log', endpoint: 'objects' },
    { key: 'patrol', path: '/patrol', icon: '🛡️', label: 'Robot Patrol', desc: 'Security patrol rounds', endpoint: 'patrol' },
    { key: 'navigation', path: '/navigation', icon: '🗺️', label: 'Navigation', desc: 'Robot navigation & mapping', endpoint: 'navigation' },
    { key: 'companion', path: '/companion', icon: '🧸', label: 'Companion', desc: 'Robot companion activities', endpoint: 'companion' },
    { key: 'sleep', path: '/sleep', icon: '😴', label: 'Sleep Analysis', desc: 'AI sleep tracking', endpoint: 'sleep' },
    { key: 'anomalies', path: '/anomalies', icon: '⚠️', label: 'Anomalies', desc: 'AI anomaly detection', endpoint: 'anomalies' },
    { key: 'predictive', path: '/predictive', icon: '🔮', label: 'Predictive AI', desc: 'Predictive maintenance', endpoint: 'predictive' },
    { key: 'recommendations', path: '/recommendations', icon: '💡', label: 'AI Recommendations', desc: 'AI-powered suggestions', endpoint: 'recommendations' },
    { key: 'ai', path: '/ai', icon: '🤖', label: 'AI Assistant', desc: 'Chat with your home AI', endpoint: null },
  ]},
];

const allFeatures = featureGroups.flatMap(g => g.items);

export default function Dashboard({ setCurrentPage }) {
  const { token, API } = useContext(AppContext);
  const [counts, setCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      const results = {};
      const promises = allFeatures.map(async (f) => {
        if (!f.endpoint) { results[f.key] = ''; return; }
        try {
          const res = await fetch(`${API}/${f.endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          results[f.key] = Array.isArray(data) ? data.length : 0;
        } catch { results[f.key] = 0; }
      });
      await Promise.all(promises);
      setCounts(results);
    };
    fetchCounts();
  }, [token, API]);

  const handleCardClick = (feature) => {
    setCurrentPage(feature.key);
    navigate(feature.path);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome to your AI-powered smart home control center</p>
        </div>
      </div>
      {featureGroups.map(group => (
        <div key={group.group} style={{ marginBottom: 32 }}>
          <h3 style={{ color: '#94a3b8', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, paddingLeft: 4 }}>{group.group}</h3>
          <div className="dashboard-grid">
            {group.items.map(f => (
              <div key={f.key} className="dash-card" onClick={() => handleCardClick(f)}>
                <div className="card-icon">{f.icon}</div>
                <h3>{f.label}</h3>
                {f.endpoint && <div className="card-count">{counts[f.key] ?? '...'}</div>}
                <div className="card-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
