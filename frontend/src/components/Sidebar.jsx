import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navGroups = [
  { group: 'Main', items: [
    { key: 'dashboard', path: '/', icon: '🏠', label: 'Dashboard' },
  ]},
  { group: 'Smart Home', items: [
    { key: 'devices', path: '/devices', icon: '📱', label: 'Devices' },
    { key: 'rooms', path: '/rooms', icon: '🏡', label: 'Rooms' },
    { key: 'automations', path: '/automations', icon: '⚡', label: 'Automations' },
    { key: 'scenes', path: '/scenes', icon: '🎬', label: 'Scenes' },
    { key: 'energy', path: '/energy', icon: '💡', label: 'Energy' },
    { key: 'security', path: '/security', icon: '🔒', label: 'Security' },
    { key: 'sensors', path: '/sensors', icon: '📡', label: 'Sensors' },
    { key: 'schedules', path: '/schedules', icon: '⏰', label: 'Schedules' },
    { key: 'notifications', path: '/notifications', icon: '🔔', label: 'Notifications' },
    { key: 'maintenance', path: '/maintenance', icon: '🔧', label: 'Maintenance' },
    { key: 'analytics', path: '/analytics', icon: '📊', label: 'Analytics' },
  ]},
  { group: 'Home Life', items: [
    { key: 'profiles', path: '/profiles', icon: '👨‍👩‍👧‍👦', label: 'Profiles' },
    { key: 'calendar', path: '/calendar', icon: '📅', label: 'Calendar' },
    { key: 'shopping', path: '/shopping', icon: '🛒', label: 'Shopping' },
    { key: 'recipes', path: '/recipes', icon: '🍳', label: 'Recipes' },
    { key: 'mealplan', path: '/mealplan', icon: '🍽️', label: 'Meal Plans' },
    { key: 'chores', path: '/chores', icon: '✅', label: 'Chores' },
    { key: 'budget', path: '/budget', icon: '💰', label: 'Budget' },
    { key: 'inventory', path: '/inventory', icon: '🥫', label: 'Pantry' },
    { key: 'weather', path: '/weather', icon: '🌤️', label: 'Weather' },
    { key: 'pets', path: '/pets', icon: '🐾', label: 'Pets' },
    { key: 'plants', path: '/plants', icon: '🌱', label: 'Plants' },
    { key: 'guests', path: '/guests', icon: '🏠', label: 'Guests' },
    { key: 'media', path: '/media', icon: '🎵', label: 'Media' },
    { key: 'laundry', path: '/laundry', icon: '👕', label: 'Laundry' },
    { key: 'packages', path: '/packages', icon: '📦', label: 'Packages' },
    { key: 'warranty', path: '/warranty', icon: '📋', label: 'Warranty' },
    { key: 'emergency', path: '/emergency', icon: '🚨', label: 'Emergency' },
    { key: 'intercom', path: '/intercom', icon: '📢', label: 'Intercom' },
  ]},
  { group: 'Robot AI', items: [
    { key: 'robotstatus', path: '/robotstatus', icon: '🤖', label: 'Robot Status' },
    { key: 'robottasks', path: '/robottasks', icon: '📋', label: 'Robot Tasks' },
    { key: 'voice', path: '/voice', icon: '🎤', label: 'Voice' },
    { key: 'faces', path: '/faces', icon: '👤', label: 'Faces' },
    { key: 'emotions', path: '/emotions', icon: '😊', label: 'Emotions' },
    { key: 'gestures', path: '/gestures', icon: '🤚', label: 'Gestures' },
    { key: 'objects', path: '/objects', icon: '🔍', label: 'Objects' },
    { key: 'patrol', path: '/patrol', icon: '🛡️', label: 'Patrol' },
    { key: 'navigation', path: '/navigation', icon: '🗺️', label: 'Navigation' },
    { key: 'companion', path: '/companion', icon: '🧸', label: 'Companion' },
    { key: 'sleep', path: '/sleep', icon: '😴', label: 'Sleep' },
    { key: 'anomalies', path: '/anomalies', icon: '⚠️', label: 'Anomalies' },
    { key: 'predictive', path: '/predictive', icon: '🔮', label: 'Predictive AI' },
    { key: 'recommendations', path: '/recommendations', icon: '💡', label: 'Recommendations' },
    { key: 'ai', path: '/ai', icon: '🤖', label: 'AI Assistant' },
  ]},
];

export default function Sidebar({ currentPage, setCurrentPage, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>AI Home Companion</h1>
        <p>Smart Living, Simplified</p>
      </div>
      <nav className="sidebar-nav">
        {navGroups.map(group => (
          <div key={group.group}>
            <div className="nav-group-label">{group.group}</div>
            {group.items.map(item => (
              <button
                key={item.key}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => { setCurrentPage(item.key); navigate(item.path); }}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, textAlign: 'center' }}>
          {user.name || 'User'} ({user.role || 'admin'})
        </div>
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
