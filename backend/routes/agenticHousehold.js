// Agentic household orchestrator autonomously running smart-home tasks with
// human override.
// Audit: batch_04.md / AIhomecompanion / Custom Feature Suggestions #1
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');

router.use(auth);

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'AIhomecompanion - Agentic Household'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, max_tokens: 2500
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'AI failed');
  return d.choices[0].message.content;
}

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/agentic-household/orchestrate { goal, constraints? }
router.post('/orchestrate', async (req, res) => {
  try {
    const { goal, constraints = {}, autonomy_level = 'recommend' } = req.body || {};
    if (!goal) return res.status(400).json({ error: 'goal required' });

    let devices = { rows: [] };
    let automations = { rows: [] };
    let occupants = { rows: [] };
    try { devices = await pool.query(`SELECT id, name, type, state FROM devices LIMIT 100`); } catch (_) {}
    try { automations = await pool.query(`SELECT id, name, trigger, action FROM automations LIMIT 50`); } catch (_) {}
    try { occupants = await pool.query(`SELECT id, name, preferences FROM profiles LIMIT 20`); } catch (_) {}

    const systemPrompt = `You are an agentic household orchestrator. Given a high-level goal (e.g., "movie night",
"morning routine", "good night"), break it into multi-device actions, scheduling, and required confirmations.
Respect autonomy_level: 'recommend' (no auto-exec), 'execute_low_risk', 'execute_with_confirmation'. Return
STRICT JSON only.`;

    const userPrompt = `Goal: ${goal}
Constraints: ${JSON.stringify(constraints)}
Autonomy level: ${autonomy_level}
Devices: ${JSON.stringify(devices.rows.slice(0, 30))}
Automations: ${JSON.stringify(automations.rows.slice(0, 20))}
Occupants/preferences: ${JSON.stringify(occupants.rows)}

Return JSON:
{
  "summary": "...",
  "action_plan": [
    { "step": 1, "device_id": "string", "action": "string", "estimated_time_seconds": 0, "requires_confirmation": false, "fallback_if_offline": "string" }
  ],
  "preconditions": ["..."],
  "safety_checks": ["..."],
  "human_override_prompt": "string",
  "expected_completion_seconds": 0,
  "disclaimer": "Agentic plan; final execution requires user confirmation per autonomy level."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);

    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS agentic_household_runs (
        id SERIAL PRIMARY KEY, user_id INTEGER, goal TEXT, autonomy_level TEXT,
        payload JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
      )`);
      await pool.query(
        `INSERT INTO agentic_household_runs (user_id, goal, autonomy_level, payload) VALUES ($1,$2,$3,$4)`,
        [req.user.id, goal, autonomy_level, JSON.stringify(parsed)]
      );
    } catch (_) {}

    res.json({ goal, autonomy_level, plan: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, goal, autonomy_level, payload, created_at FROM agentic_household_runs
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [req.user.id]
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
