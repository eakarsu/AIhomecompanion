// Apply pass 5 — additive non-AI feature: family member sharing & permissions.
// Auto-creates `family_permissions` table on first request (additive only).

const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

let initialized = false;
async function ensureSchema() {
  if (initialized) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS family_permissions (
      id SERIAL PRIMARY KEY,
      household_owner_id INTEGER NOT NULL,
      member_user_id INTEGER,
      member_email VARCHAR(255),
      display_name VARCHAR(255),
      role VARCHAR(64) DEFAULT 'member',
      scopes JSONB NOT NULL DEFAULT '[]',
      status VARCHAR(32) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(household_owner_id, member_user_id),
      UNIQUE(household_owner_id, member_email)
    )`);
    initialized = true;
  } catch (e) { console.error('family_permissions schema init failed:', e.message); }
}

router.use(auth);
router.use(async (_req, _res, next) => { await ensureSchema(); next(); });

// VALID_SCOPES — explicit allow-list to avoid arbitrary-string scope creep
const VALID_SCOPES = [
  'view-status', 'control-lights', 'control-thermostat', 'control-locks',
  'manage-automations', 'manage-scenes', 'view-energy', 'manage-energy',
  'view-security-events', 'manage-security', 'manage-guests', 'manage-shopping',
  'manage-pets', 'manage-plants', 'view-cameras', 'view-calendar',
];

function sanitizeScopes(scopes) {
  if (!Array.isArray(scopes)) return [];
  return scopes.filter(s => typeof s === 'string' && VALID_SCOPES.includes(s));
}

// List members
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM family_permissions WHERE household_owner_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add or invite a member
router.post('/', async (req, res) => {
  try {
    const { member_email, member_user_id, display_name, role, scopes } = req.body || {};
    if (!member_email && !member_user_id) {
      return res.status(400).json({ error: 'member_email or member_user_id required' });
    }
    const scopesClean = sanitizeScopes(scopes);
    const r = await pool.query(
      `INSERT INTO family_permissions (household_owner_id, member_user_id, member_email, display_name, role, scopes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (household_owner_id, member_email) DO UPDATE SET
         display_name = EXCLUDED.display_name, role = EXCLUDED.role, scopes = EXCLUDED.scopes, updated_at = NOW()
       RETURNING *`,
      [req.user.id, member_user_id || null, member_email || null, display_name || null,
       role || 'member', JSON.stringify(scopesClean)]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update permissions
router.put('/:id', async (req, res) => {
  try {
    const { display_name, role, scopes, status } = req.body || {};
    const fields = []; const params = [];
    if (display_name !== undefined) { params.push(display_name); fields.push(`display_name = $${params.length}`); }
    if (role !== undefined) { params.push(role); fields.push(`role = $${params.length}`); }
    if (scopes !== undefined) { params.push(JSON.stringify(sanitizeScopes(scopes))); fields.push(`scopes = $${params.length}`); }
    if (status !== undefined) { params.push(status); fields.push(`status = $${params.length}`); }
    if (!fields.length) return res.status(400).json({ error: 'no fields to update' });
    params.push(req.params.id, req.user.id);
    const r = await pool.query(
      `UPDATE family_permissions SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length - 1} AND household_owner_id = $${params.length}
       RETURNING *`,
      params
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'member not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      'DELETE FROM family_permissions WHERE id = $1 AND household_owner_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'member not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// List allowed scopes (introspection)
router.get('/scopes/allowed', (_req, res) => res.json({ scopes: VALID_SCOPES }));

module.exports = router;
