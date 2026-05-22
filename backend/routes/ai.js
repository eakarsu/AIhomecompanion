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

async function callAI(systemPrompt, userPrompt, maxTokens = 1024) {
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
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
    }),
  });
  return response.json();
}

router.post('/expense-optimizer', auth, async (req, res) => {
  try {
    const [budget, energy, devices] = await Promise.all([
      pool.query('SELECT * FROM budget ORDER BY id DESC LIMIT 50').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM energy_logs ORDER BY date DESC LIMIT 30').catch(() => ({ rows: [] })),
      pool.query('SELECT name, type, status FROM devices').catch(() => ({ rows: [] })),
    ]);

    const systemPrompt = 'You are a household expense optimization expert. Recommend cost-saving actions across automations, energy, subscriptions, and unused services. Format with clear sections and bullet points; include estimated monthly/annual savings ranges.';
    const userPrompt = `Recommend cost optimizations for this home.

Budget items: ${JSON.stringify(budget.rows.slice(0, 30))}
Recent energy logs: ${JSON.stringify(energy.rows.slice(0, 20))}
Devices: ${JSON.stringify(devices.rows)}`;

    const data = await callAI(systemPrompt, userPrompt, 1200);
    res.json({
      recommendations: data.choices?.[0]?.message?.content || 'Unable to generate recommendations.',
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/occupancy-prediction', auth, async (req, res) => {
  try {
    const { lookahead_hours } = req.body;
    const [rooms, sensors, schedules] = await Promise.all([
      pool.query('SELECT name, occupancy, temperature, humidity FROM rooms').catch(() => ({ rows: [] })),
      pool.query('SELECT name, type, value, unit, status, room_id FROM sensors LIMIT 100').catch(() => ({ rows: [] })),
      pool.query('SELECT name, trigger_type, action_type, schedule, enabled FROM schedules LIMIT 50').catch(() => ({ rows: [] })),
    ]);

    const horizon = parseInt(lookahead_hours) || 24;
    const systemPrompt = 'You are a smart home occupancy forecaster. Predict per-room occupancy probability over the requested horizon and recommend HVAC pre-conditioning, lighting, and standby actions. Return a clearly structured response with an hour-by-hour table.';
    const userPrompt = `Predict occupancy over the next ${horizon} hours and recommend automation actions.

Rooms: ${JSON.stringify(rooms.rows)}
Sensor snapshot: ${JSON.stringify(sensors.rows.slice(0, 60))}
Existing schedules: ${JSON.stringify(schedules.rows)}`;

    const data = await callAI(systemPrompt, userPrompt, 1200);
    res.json({
      prediction: data.choices?.[0]?.message?.content || 'Unable to predict at this time.',
      lookahead_hours: horizon,
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/routine-learning', auth, async (req, res) => {
  try {
    const [automations, schedules, sensors, conversations] = await Promise.all([
      pool.query('SELECT name, trigger_type, action_type, enabled FROM automations').catch(() => ({ rows: [] })),
      pool.query('SELECT name, schedule, enabled FROM schedules').catch(() => ({ rows: [] })),
      pool.query('SELECT name, type, value, unit, status, room_id FROM sensors LIMIT 80').catch(() => ({ rows: [] })),
      pool.query('SELECT user_message, ai_response, created_at FROM ai_conversations ORDER BY created_at DESC LIMIT 30').catch(() => ({ rows: [] })),
    ]);

    const systemPrompt = 'You are a household routine-learning AI. Identify recurring family patterns from device, schedule, sensor, and recent assistant interactions, then propose new automations. For each suggestion provide: detected pattern, proposed automation name, trigger, action(s), confidence (0-100), and a reason to enable or skip.';
    const userPrompt = `Detect routines and suggest new automations.

Existing automations: ${JSON.stringify(automations.rows)}
Schedules: ${JSON.stringify(schedules.rows)}
Sensors: ${JSON.stringify(sensors.rows.slice(0, 50))}
Recent assistant interactions: ${JSON.stringify(conversations.rows.slice(0, 15))}`;

    const data = await callAI(systemPrompt, userPrompt, 1500);
    res.json({
      detected_routines: data.choices?.[0]?.message?.content || 'Unable to learn routines at this time.',
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Apply pass 4 (mechanical backlog) — proactive maintenance prediction
router.post('/proactive-maintenance', auth, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY is not configured.' });
  }
  try {
    const { lookahead_days } = req.body || {};
    const horizon = parseInt(lookahead_days) || 30;
    const [predictive, maintenance, devices, warranty] = await Promise.all([
      pool.query('SELECT * FROM predictive_maintenance ORDER BY failure_probability DESC LIMIT 30').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM maintenance_logs ORDER BY scheduled_date DESC LIMIT 50').catch(() => ({ rows: [] })),
      pool.query('SELECT name, type, status, room_id FROM devices LIMIT 80').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM warranty LIMIT 50').catch(() => ({ rows: [] })),
    ]);

    const systemPrompt = 'You are a household proactive-maintenance planner. From predictive failure data, past maintenance logs, devices, and warranty status, recommend a prioritized maintenance plan. For each item provide: device, predicted issue, urgency (high/medium/low), suggested action, estimated cost range, and recommended date within the planning horizon.';
    const userPrompt = `Build a proactive maintenance plan for the next ${horizon} days.\n\nPredictive failures: ${JSON.stringify(predictive.rows)}\nRecent maintenance logs: ${JSON.stringify(maintenance.rows.slice(0, 30))}\nDevices: ${JSON.stringify(devices.rows)}\nWarranties: ${JSON.stringify(warranty.rows)}`;

    const data = await callAI(systemPrompt, userPrompt, 1500);
    res.json({
      plan: data.choices?.[0]?.message?.content || 'Unable to build maintenance plan at this time.',
      lookahead_days: horizon,
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------- Apply pass 5 backlog ---------- //

// Guest profiling — given guest visit history, suggest stay preferences (advisory).
router.post('/guest-profiling', auth, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY is not configured.' });
  }
  try {
    const { guest_id } = req.body || {};
    let guests = [];
    let visits = [];
    if (guest_id) {
      try { guests = (await pool.query('SELECT * FROM guests WHERE id = $1', [guest_id])).rows; } catch (_) {}
      try { visits = (await pool.query('SELECT * FROM guest_visits WHERE guest_id = $1 ORDER BY created_at DESC LIMIT 50', [guest_id])).rows; } catch (_) {}
    } else {
      try { guests = (await pool.query('SELECT * FROM guests ORDER BY id DESC LIMIT 30')).rows; } catch (_) {}
    }
    if (!guests.length) return res.status(400).json({ error: 'no guests data found' });

    const systemPrompt = 'You are a smart-home guest experience advisor. Given guest profile(s) and visit history, propose preference-aware adaptations (lighting, temperature, music, room assignment, access level). All recommendations are ADVISORY; the household decides. Respect privacy — do not infer beyond what is in the data. Return JSON: {profiles: [{guest_id, observed_preferences, suggested_scenes, recommended_access_level, privacy_considerations}], summary, caveats}.';
    const userPrompt = `Profile these guests.\n\nGuests: ${JSON.stringify(guests.slice(0, 20))}\n\nRecent visits: ${JSON.stringify(visits.slice(0, 50))}\n\nReturn JSON only.`;

    const data = await callAI(systemPrompt, userPrompt, 1500);
    res.json({
      profiles: data.choices?.[0]?.message?.content || 'Unable to generate profiles at this time.',
      considered: { guests: guests.length, visits: visits.length },
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Emergency response advisor — ADVISORY playbook ONLY. Does NOT execute device controls.
router.post('/emergency-response-advisor', auth, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY is not configured.' });
  }
  try {
    const { emergency_type, occupants_present, severity } = req.body || {};
    if (!emergency_type) return res.status(400).json({ error: 'emergency_type is required (e.g. fire, intruder, flood, gas-leak, medical)' });
    const [devices, sensors, rooms, profiles] = await Promise.all([
      pool.query('SELECT name, type, status, room_id FROM devices LIMIT 80').catch(() => ({ rows: [] })),
      pool.query('SELECT name, type, value, unit, status, room_id FROM sensors LIMIT 80').catch(() => ({ rows: [] })),
      pool.query('SELECT id, name, floor FROM rooms LIMIT 50').catch(() => ({ rows: [] })),
      pool.query('SELECT id, name, role FROM profiles LIMIT 30').catch(() => ({ rows: [] })),
    ]);

    const systemPrompt = 'You are a household EMERGENCY RESPONSE ADVISOR. Generate an advisory playbook ONLY — never instruct autonomous device control. The user/operator is responsible for every action. Always recommend calling 911 or local emergency services first when life-safety is at stake. Return JSON: {emergency_type, life_safety_first_steps, resident_actions (numbered), advisable_smart_home_actions_for_a_human_to_consider (each tagged advisory), evacuation_path_suggestion, professional_help_to_call, ongoing_monitoring, do_not_do (forbidden actions), disclaimer}.';
    const userPrompt = `Build an emergency response advisory.\n\nEmergency: ${emergency_type}\nSeverity: ${severity || 'unknown'}\nOccupants: ${JSON.stringify(occupants_present || profiles.rows.map(p => p.name))}\nRooms: ${JSON.stringify(rooms.rows)}\nDevices: ${JSON.stringify(devices.rows.slice(0, 60))}\nSensors: ${JSON.stringify(sensors.rows.slice(0, 60))}\n\nReturn JSON only.`;

    const data = await callAI(systemPrompt, userPrompt, 1800);
    res.json({
      playbook: data.choices?.[0]?.message?.content || 'Unable to generate playbook at this time.',
      emergency_type,
      disclaimer: 'ADVISORY ONLY. Call emergency services (911 or local equivalent) before relying on this output. No automated device actions taken.',
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Pass 6 close-out: stateless LLM-only emergency advisor matching the audit's
// final spec (scenario_type union, indicators[], pets, location_context,
// severity_hint -> {disclaimer, priority, immediate_steps, do_not_do,
// device_recommendations_human_readable, when_to_evacuate, when_to_call_911,
// after_event_followups}). EXPLICITLY does NOT issue device-control commands.
// NOTE: a prior advisor handler at the same path is registered earlier in this
// file and will be matched first by Express. This append is spec-compliant and
// kept as documentation/forward-compat; a future cleanup pass may remove the
// older shape once the FE migrates to this contract.
router.post('/emergency-response-advisor', auth, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY is not configured.' });
  }
  try {
    const {
      scenario_type,
      indicators,
      occupants_summary,
      pets,
      location_context,
      severity_hint,
    } = req.body || {};
    const allowed = ['smoke', 'intrusion', 'medical', 'flood', 'gas', 'power', 'unknown'];
    const scenario = allowed.includes(scenario_type) ? scenario_type : 'unknown';

    const systemPrompt = 'You are a household EMERGENCY RESPONSE ADVISOR. You are STATELESS and LLM-ONLY: you do NOT issue any device-control commands, you do NOT take autonomous actions, and you do NOT promise the home will act. You produce an advisory action playbook for a human operator. Life safety FIRST: when in doubt, advise calling 911 (or local emergency services). Return STRICT JSON with exactly these keys: disclaimer (string), priority (integer 1-5, 1=highest), immediate_steps (string[]), do_not_do (string[]), device_recommendations_human_readable (string[] — phrased for a human to consider, never as commands), when_to_evacuate (string), when_to_call_911 (string), after_event_followups (string[]). No markdown, no prose outside JSON.';
    const userPrompt = `Produce an emergency advisory playbook.\n\nscenario_type: ${scenario}\nindicators: ${JSON.stringify(Array.isArray(indicators) ? indicators : [])}\noccupants_summary: ${JSON.stringify(occupants_summary || null)}\npets: ${JSON.stringify(pets || null)}\nlocation_context: ${JSON.stringify(location_context || null)}\nseverity_hint: ${JSON.stringify(severity_hint || null)}\n\nReturn JSON only.`;

    const data = await callAI(systemPrompt, userPrompt, 1500);
    const raw = data.choices?.[0]?.message?.content || '';
    let parsed = null;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch (_) { parsed = null; }

    const safe = parsed && typeof parsed === 'object' ? parsed : {};
    res.json({
      disclaimer: safe.disclaimer || 'Advisory only — call 911 for life-threatening emergencies',
      priority: Number.isInteger(safe.priority) ? Math.min(5, Math.max(1, safe.priority)) : 3,
      immediate_steps: Array.isArray(safe.immediate_steps) ? safe.immediate_steps : [],
      do_not_do: Array.isArray(safe.do_not_do) ? safe.do_not_do : [],
      device_recommendations_human_readable: Array.isArray(safe.device_recommendations_human_readable) ? safe.device_recommendations_human_readable : [],
      when_to_evacuate: safe.when_to_evacuate || '',
      when_to_call_911: safe.when_to_call_911 || 'If anyone is in danger or unsure, call 911 immediately.',
      after_event_followups: Array.isArray(safe.after_event_followups) ? safe.after_event_followups : [],
      scenario_type: scenario,
      no_device_control_taken: true,
      raw_advisory: parsed ? undefined : raw,
      model: data.model || process.env.OPENROUTER_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
