const express = require('express');
const cors = require('cors');
// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_expense_optimizer_for_service_cancell = require('./routes/gap-no-expense-optimizer-for-service-cancell');
const route_gap_no_occupancy_prediction_model = require('./routes/gap-no-occupancy-prediction-model');
const route_gap_no_guest_profiling_ai = require('./routes/gap-no-guest-profiling-ai');
const route_gap_no_emergency_response_coordination_ai = require('./routes/gap-no-emergency-response-coordination-ai');
const route_gap_no_routine_learning_new_automation_sugge = require('./routes/gap-no-routine-learning-new-automation-sugge');
const route_gap_no_device_marketplace_integration = require('./routes/gap-no-device-marketplace-integration');
const route_gap_no_vendor_service_booking = require('./routes/gap-no-vendor-service-booking');
const route_gap_no_multi_home_management = require('./routes/gap-no-multi-home-management');
const route_gap_no_audit_log_0_references = require('./routes/gap-no-audit-log-0-references');
const route_gap_no_webhook_surface = require('./routes/gap-no-webhook-surface');
const route_gap_no_websocket_real_time_device_updates = require('./routes/gap-no-websocket-real-time-device-updates');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Core Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/automations', require('./routes/automations'));
app.use('/api/scenes', require('./routes/scenes'));
app.use('/api/energy', require('./routes/energy'));
app.use('/api/security', require('./routes/security'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/ai', require('./routes/ai'));

// Home Life Features
app.use('/api/weather', require('./routes/weather'));
app.use('/api/shopping', require('./routes/shopping'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/chores', require('./routes/chores'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/plants', require('./routes/plants'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/intercom', require('./routes/intercom'));
app.use('/api/media', require('./routes/media'));
app.use('/api/laundry', require('./routes/laundry'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/warranty', require('./routes/warranty'));
app.use('/api/budget', require('./routes/budget'));

// Robot AI Features
app.use('/api/voice', require('./routes/voice'));
app.use('/api/faces', require('./routes/faces'));
app.use('/api/patrol', require('./routes/patrol'));
app.use('/api/objects', require('./routes/objects'));
app.use('/api/gestures', require('./routes/gestures'));
app.use('/api/emotions', require('./routes/emotions'));
app.use('/api/navigation', require('./routes/navigation'));
app.use('/api/robotstatus', require('./routes/robotstatus'));
app.use('/api/robottasks', require('./routes/robottasks'));
app.use('/api/mealplan', require('./routes/mealplan'));
app.use('/api/sleep', require('./routes/sleep'));
app.use('/api/companion', require('./routes/companion'));
app.use('/api/anomalies', require('./routes/anomalies'));
app.use('/api/predictive', require('./routes/predictive'));

// Apply pass 5 backlog: family member sharing & permissions
app.use('/api/family-permissions', require('./routes/familyPermissions'));
app.use('/api/energy-arbitrage', require('./routes/energyArbitrage'));
app.use('/api/agentic-household', require('./routes/agenticHousehold'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.BACKEND_PORT || 3001;

app.use('/api/gap-no-expense-optimizer-for-service-cancell', route_gap_no_expense_optimizer_for_service_cancell);
app.use('/api/gap-no-occupancy-prediction-model', route_gap_no_occupancy_prediction_model);
app.use('/api/gap-no-guest-profiling-ai', route_gap_no_guest_profiling_ai);
app.use('/api/gap-no-emergency-response-coordination-ai', route_gap_no_emergency_response_coordination_ai);
app.use('/api/gap-no-routine-learning-new-automation-sugge', route_gap_no_routine_learning_new_automation_sugge);
app.use('/api/gap-no-device-marketplace-integration', route_gap_no_device_marketplace_integration);
app.use('/api/gap-no-vendor-service-booking', route_gap_no_vendor_service_booking);
app.use('/api/gap-no-multi-home-management', route_gap_no_multi_home_management);
app.use('/api/gap-no-audit-log-0-references', route_gap_no_audit_log_0_references);
app.use('/api/gap-no-webhook-surface', route_gap_no_webhook_surface);
app.use('/api/gap-no-websocket-real-time-device-updates', route_gap_no_websocket_real_time_device_updates);

// === Custom Views (mount BEFORE 404) ===
app.use('/api/custom-views', require('./routes/customViews'));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
