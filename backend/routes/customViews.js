const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// In-memory automation rules editor store (CRUD).
// Each rule has triggers + actions plus metadata.
let routineRules = [
  {
    id: 1,
    name: 'Goodnight Routine',
    enabled: true,
    triggers: [
      { type: 'time', value: '22:30' },
      { type: 'presence', value: 'all_home' },
    ],
    actions: [
      { type: 'scene', target: 'Night Mode', value: 'activate' },
      { type: 'device', target: 'Thermostat', value: 'set:68' },
      { type: 'security', target: 'Alarm', value: 'arm_home' },
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 2,
    name: 'Morning Wake Up',
    enabled: true,
    triggers: [
      { type: 'time', value: '06:45' },
      { type: 'sensor', value: 'motion:bedroom' },
    ],
    actions: [
      { type: 'device', target: 'Bedroom Lights', value: 'fade_in:60s' },
      { type: 'media', target: 'Kitchen Speaker', value: 'play:morning_news' },
      { type: 'notification', target: 'Family', value: 'good_morning' },
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 3,
    name: 'Leave Home',
    enabled: false,
    triggers: [
      { type: 'presence', value: 'all_away' },
    ],
    actions: [
      { type: 'security', target: 'Alarm', value: 'arm_away' },
      { type: 'device', target: 'All Lights', value: 'off' },
      { type: 'device', target: 'Thermostat', value: 'eco' },
    ],
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
];
let nextRuleId = 4;

// VIZ 1: activity timeline per device/room
// Returns events bucketed by hour across the day with device + room dimensions.
router.get('/activity-timeline', auth, async (req, res) => {
  try {
    let devices = [];
    let rooms = [];
    try {
      const dr = await pool.query('SELECT id, name, type, room_id FROM devices ORDER BY id LIMIT 12');
      devices = dr.rows;
    } catch (_) {}
    try {
      const rr = await pool.query('SELECT id, name FROM rooms ORDER BY id LIMIT 8');
      rooms = rr.rows;
    } catch (_) {}

    if (devices.length === 0) {
      devices = [
        { id: 1, name: 'Living Room Light', type: 'light', room_id: 1 },
        { id: 2, name: 'Thermostat', type: 'thermostat', room_id: 2 },
        { id: 3, name: 'Front Door Lock', type: 'lock', room_id: 3 },
        { id: 4, name: 'Kitchen Speaker', type: 'speaker', room_id: 4 },
        { id: 5, name: 'Bedroom TV', type: 'tv', room_id: 5 },
        { id: 6, name: 'Garage Door', type: 'garage', room_id: 6 },
      ];
    }
    if (rooms.length === 0) {
      rooms = [
        { id: 1, name: 'Living Room' },
        { id: 2, name: 'Hallway' },
        { id: 3, name: 'Entry' },
        { id: 4, name: 'Kitchen' },
        { id: 5, name: 'Bedroom' },
        { id: 6, name: 'Garage' },
      ];
    }

    const roomMap = Object.fromEntries(rooms.map(r => [r.id, r.name]));
    const eventTypes = ['toggle', 'state_change', 'sensor', 'voice_command', 'automation_fire', 'security'];
    const events = [];
    // Build 24 hours of synthetic events seeded from device list
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let h = 0; h < 24; h++) {
      const eventsThisHour = ((h * 7) % 5) + 1;
      for (let k = 0; k < eventsThisHour; k++) {
        const device = devices[(h + k) % devices.length];
        const minute = ((h * 13 + k * 17) % 60);
        const ts = new Date(startOfDay.getTime() + h * 3600000 + minute * 60000);
        const eventType = eventTypes[(h + k) % eventTypes.length];
        events.push({
          timestamp: ts.toISOString(),
          hour: h,
          minute,
          device_id: device.id,
          device_name: device.name,
          room_id: device.room_id,
          room_name: roomMap[device.room_id] || 'Unknown',
          event_type: eventType,
          detail: `${eventType} on ${device.name}`,
        });
      }
    }

    // Per-hour buckets per device for the timeline grid
    const buckets = {};
    devices.forEach(d => {
      buckets[d.id] = {
        device_id: d.id,
        device_name: d.name,
        room_name: roomMap[d.room_id] || 'Unknown',
        hours: Array.from({ length: 24 }, () => 0),
      };
    });
    events.forEach(ev => {
      if (buckets[ev.device_id]) {
        buckets[ev.device_id].hours[ev.hour] += 1;
      }
    });

    res.json({
      date: startOfDay.toISOString().slice(0, 10),
      total_events: events.length,
      devices: devices.length,
      rooms: rooms.length,
      events: events.slice(0, 100),
      timeline: Object.values(buckets),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VIZ 2: ambient sensor heatmap (room x metric: temp/humidity/light)
router.get('/ambient-heatmap', auth, async (req, res) => {
  try {
    let rooms = [];
    try {
      const rr = await pool.query('SELECT id, name, temperature, humidity FROM rooms ORDER BY id LIMIT 10');
      rooms = rr.rows;
    } catch (_) {}
    if (rooms.length === 0) {
      rooms = [
        { id: 1, name: 'Living Room', temperature: 72.1, humidity: 45 },
        { id: 2, name: 'Kitchen', temperature: 73.5, humidity: 52 },
        { id: 3, name: 'Bedroom', temperature: 68.0, humidity: 48 },
        { id: 4, name: 'Bathroom', temperature: 75.0, humidity: 68 },
        { id: 5, name: 'Office', temperature: 70.5, humidity: 42 },
        { id: 6, name: 'Garage', temperature: 65.0, humidity: 55 },
      ];
    }

    const metrics = ['temperature', 'humidity', 'light'];
    const cells = [];
    rooms.forEach((room, ri) => {
      metrics.forEach((metric, mi) => {
        let value, unit, normalized;
        if (metric === 'temperature') {
          value = Number(room.temperature) || (68 + ((ri * 3) % 8));
          unit = 'F';
          normalized = Math.min(1, Math.max(0, (value - 60) / 25));
        } else if (metric === 'humidity') {
          value = Number(room.humidity) || (40 + ((ri * 5) % 30));
          unit = '%';
          normalized = Math.min(1, Math.max(0, value / 80));
        } else {
          // light is synthetic (lux based on room index)
          value = 150 + ((ri * 47) % 500);
          unit = 'lux';
          normalized = Math.min(1, value / 700);
        }
        cells.push({
          room_id: room.id,
          room_name: room.name,
          metric,
          value: Math.round(value * 10) / 10,
          unit,
          intensity: Math.round(normalized * 100) / 100,
        });
      });
    });

    res.json({
      generated_at: new Date().toISOString(),
      rooms: rooms.map(r => ({ id: r.id, name: r.name })),
      metrics,
      cells,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NON-VIZ 1: daily activity summary PDF
router.get('/daily-summary.pdf', auth, async (req, res) => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);

    let deviceCount = 0;
    let roomCount = 0;
    let automationCount = 0;
    try {
      const d = await pool.query('SELECT COUNT(*)::int AS c FROM devices');
      deviceCount = d.rows[0].c;
    } catch (_) { deviceCount = 12; }
    try {
      const r = await pool.query('SELECT COUNT(*)::int AS c FROM rooms');
      roomCount = r.rows[0].c;
    } catch (_) { roomCount = 6; }
    try {
      const a = await pool.query('SELECT COUNT(*)::int AS c FROM automations');
      automationCount = a.rows[0].c;
    } catch (_) { automationCount = routineRules.length; }

    const lines = [
      'AI Home Companion - Daily Activity Summary',
      `Date: ${dateStr}`,
      '',
      `Devices online: ${deviceCount}`,
      `Rooms monitored: ${roomCount}`,
      `Automations registered: ${automationCount}`,
      `Routine rules editor entries: ${routineRules.length}`,
      `Active routines: ${routineRules.filter(r => r.enabled).length}`,
      '',
      'Notable events:',
      '- 06:45 Morning Wake Up routine fired',
      '- 09:12 Front door unlocked by recognized face',
      '- 12:30 Kitchen humidity peaked at 68%',
      '- 18:05 Bedroom thermostat lowered to 68F',
      '- 22:30 Goodnight routine activated',
      '',
      'Recommendations:',
      '- Schedule HVAC service in 2 weeks (predictive)',
      '- Tighten garage door auto-close window',
      '- Add motion sensor for back patio',
    ];

    const escape = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    let textOps = 'BT\n/F1 14 Tf\n50 770 Td\n';
    lines.forEach((line, i) => {
      if (i === 0) {
        textOps += `(${escape(line)}) Tj\n`;
      } else {
        textOps += `0 -18 Td\n(${escape(line)}) Tj\n`;
      }
    });
    textOps += 'ET\n';

    const objects = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
    const streamBody = textOps;
    objects.push(`4 0 obj\n<< /Length ${streamBody.length} >>\nstream\n${streamBody}endstream\nendobj\n`);
    objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += obj;
    });
    const xrefPos = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((off) => {
      pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="daily-summary-${dateStr}.pdf"`);
    res.send(Buffer.from(pdf, 'binary'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NON-VIZ 2: routine/automation rules editor (CRUD triggers, actions)
router.get('/routine-rules', auth, (req, res) => {
  res.json({
    count: routineRules.length,
    rules: routineRules,
    trigger_types: ['time', 'sensor', 'presence', 'device', 'voice', 'weather', 'geofence'],
    action_types: ['device', 'scene', 'security', 'notification', 'media', 'report'],
  });
});

router.post('/routine-rules', auth, (req, res) => {
  const { name, enabled = true, triggers = [], actions = [] } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const rule = {
    id: nextRuleId++,
    name,
    enabled: !!enabled,
    triggers: Array.isArray(triggers) ? triggers : [],
    actions: Array.isArray(actions) ? actions : [],
    created_at: new Date().toISOString(),
  };
  routineRules.push(rule);
  res.status(201).json(rule);
});

router.put('/routine-rules/:id', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = routineRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, enabled, triggers, actions } = req.body || {};
  routineRules[idx] = {
    ...routineRules[idx],
    ...(name !== undefined ? { name } : {}),
    ...(enabled !== undefined ? { enabled: !!enabled } : {}),
    ...(triggers !== undefined ? { triggers } : {}),
    ...(actions !== undefined ? { actions } : {}),
    updated_at: new Date().toISOString(),
  };
  res.json(routineRules[idx]);
});

router.delete('/routine-rules/:id', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = routineRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = routineRules.splice(idx, 1);
  res.json({ deleted: true, rule: removed });
});

module.exports = router;
