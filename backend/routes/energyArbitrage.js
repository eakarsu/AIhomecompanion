// Real-time energy demand shifting auto-moving high-consumption tasks to
// off-peak.
// Audit: batch_04.md / AIhomecompanion / Custom Feature Suggestions #2
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
      'X-Title': 'AIhomecompanion - Energy Arbitrage'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || (process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5'),
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

// POST /api/energy-arbitrage/plan { tariff_schedule?, horizon_hours? }
router.post('/plan', async (req, res) => {
  try {
    const { tariff_schedule, horizon_hours = 24 } = req.body || {};

    let usage = { rows: [] };
    let devices = { rows: [] };
    try { usage = await pool.query(`SELECT * FROM energy ORDER BY recorded_at DESC LIMIT 200`); } catch (_) {}
    try { devices = await pool.query(`SELECT id, name, type, power_w FROM devices LIMIT 100`); } catch (_) {}

    const systemPrompt = `You are a home-energy arbitrage agent. Given device load profiles, current usage, and
a tariff schedule, recommend shifting deferrable loads (laundry, dishwasher, EV charging, pool pump, water
heater) into low-price windows. Return STRICT JSON only.`;

    const userPrompt = `Horizon (hours): ${horizon_hours}
Tariff schedule: ${JSON.stringify(tariff_schedule || { peak: '16:00-21:00', off_peak: '23:00-06:00' })}
Recent usage (sample): ${JSON.stringify(usage.rows.slice(0, 40))}
Devices (sample): ${JSON.stringify(devices.rows.slice(0, 30))}

Return JSON:
{
  "summary": "...",
  "shift_recommendations": [
    { "device_id": "string", "task": "string", "current_window": "string", "recommended_window": "string", "estimated_savings_usd": 0, "comfort_impact": "none|minor|moderate" }
  ],
  "demand_response_opportunities": [{ "event_window": "string", "estimated_credit_usd": 0, "actions": ["..."] }],
  "expected_savings_total_usd": 0,
  "carbon_kg_avoided_estimate": 0,
  "disclaimer": "Shift plan is heuristic; ratify with household preferences."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ horizon_hours, plan: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/current-usage', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM energy ORDER BY recorded_at DESC LIMIT 24`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
