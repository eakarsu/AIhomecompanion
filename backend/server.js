const express = require('express');
const cors = require('cors');
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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
