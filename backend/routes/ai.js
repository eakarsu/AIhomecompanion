const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');

async function getHomeContext() {
  const [devices, rooms, sensors, alerts] = await Promise.all([
    pool.query('SELECT name, type, status, room_id FROM devices LIMIT 10'),
    pool.query('SELECT name, temperature, humidity, occupancy FROM rooms LIMIT 10'),
    pool.query('SELECT name, type, value, unit, status FROM sensors LIMIT 10'),
    pool.query("SELECT type, severity, message FROM security_alerts WHERE is_resolved = false LIMIT 5"),
  ]);
  return {
    devices: devices.rows,
    rooms: rooms.rows,
    sensors: sensors.rows,
    active_alerts: alerts.rows,
  };
}

router.post('/chat', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const homeContext = await getHomeContext();
    const systemPrompt = `You are an intelligent AI Home Companion assistant for a smart home system. You help manage devices, automations, energy, security, and provide recommendations. Be conversational, helpful, and proactive.

Current home state:
- Active devices: ${JSON.stringify(homeContext.devices)}
- Rooms: ${JSON.stringify(homeContext.rooms)}
- Sensor readings: ${JSON.stringify(homeContext.sensors)}
- Active alerts: ${JSON.stringify(homeContext.active_alerts)}

Respond naturally and helpfully. Format responses with clear sections when appropriate. Use bullet points for lists.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Home Companion',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, I could not process that request.';
    const tokensUsed = data.usage?.total_tokens || 0;

    await pool.query(
      'INSERT INTO ai_conversations (user_message, ai_response, context, tokens_used, model) VALUES ($1, $2, $3, $4, $5)',
      [message, aiResponse, context || 'general', tokensUsed, process.env.OPENROUTER_MODEL]
    );

    res.json({
      response: aiResponse,
      tokens_used: tokensUsed,
      model: data.model || process.env.OPENROUTER_MODEL,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/analyze-energy', auth, async (req, res) => {
  try {
    const energyData = await pool.query('SELECT * FROM energy_logs ORDER BY date DESC LIMIT 20');
    const prompt = `Analyze this smart home energy consumption data and provide actionable insights, savings opportunities, and efficiency recommendations:\n${JSON.stringify(energyData.rows)}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Home Companion',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an energy efficiency expert AI. Analyze the data and provide professional insights with bullet points and sections.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    res.json({
      analysis: data.choices?.[0]?.message?.content || 'Unable to analyze at this time.',
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/analyze-security', auth, async (req, res) => {
  try {
    const alerts = await pool.query('SELECT * FROM security_alerts ORDER BY created_at DESC LIMIT 20');
    const prompt = `Analyze these smart home security alerts and provide a security assessment, risk level, and recommendations:\n${JSON.stringify(alerts.rows)}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Home Companion',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a home security expert AI. Analyze alerts and provide a professional security assessment with risk levels and actionable recommendations.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    res.json({
      analysis: data.choices?.[0]?.message?.content || 'Unable to analyze at this time.',
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/suggest-automation', auth, async (req, res) => {
  try {
    const [devices, rooms, automations] = await Promise.all([
      pool.query('SELECT name, type, room_id, status FROM devices'),
      pool.query('SELECT name, type FROM rooms'),
      pool.query('SELECT name, trigger_type, action_type FROM automations'),
    ]);
    const prompt = `Based on these smart home devices, rooms, and existing automations, suggest 5 new useful automations:\nDevices: ${JSON.stringify(devices.rows)}\nRooms: ${JSON.stringify(rooms.rows)}\nExisting: ${JSON.stringify(automations.rows)}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Home Companion',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a smart home automation expert. Suggest creative and practical automations. Format with clear titles, triggers, and actions.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    res.json({
      suggestions: data.choices?.[0]?.message?.content || 'Unable to generate suggestions.',
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/health-report', auth, async (req, res) => {
  try {
    const [sensors, analytics] = await Promise.all([
      pool.query('SELECT name, type, value, unit, status FROM sensors'),
      pool.query('SELECT metric_name, value, unit, trend FROM analytics'),
    ]);
    const prompt = `Generate a comprehensive home health report based on sensor data and analytics:\nSensors: ${JSON.stringify(sensors.rows)}\nAnalytics: ${JSON.stringify(analytics.rows)}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Home Companion',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a home wellness and environmental health expert. Generate a professional home health report with sections for air quality, climate, safety, and recommendations.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    res.json({
      report: data.choices?.[0]?.message?.content || 'Unable to generate report.',
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/conversations', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_conversations ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
