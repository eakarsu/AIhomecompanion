const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT s.*, r.name as room_name FROM scenes s LEFT JOIN rooms r ON s.room_id = r.id ORDER BY s.id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT s.*, r.name as room_name FROM scenes s LEFT JOIN rooms r ON s.room_id = r.id WHERE s.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, room_id, devices_config, mood, icon, color } = req.body;
    const result = await pool.query(
      'INSERT INTO scenes (name, description, room_id, devices_config, mood, icon, color) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, description, room_id, JSON.stringify(devices_config || {}), mood, icon || '🎬', color || '#6B7280']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, room_id, devices_config, mood, icon, color, is_active } = req.body;
    const result = await pool.query(
      'UPDATE scenes SET name=$1, description=$2, room_id=$3, devices_config=$4, mood=$5, icon=$6, color=$7, is_active=$8 WHERE id=$9 RETURNING *',
      [name, description, room_id, JSON.stringify(devices_config || {}), mood, icon, color, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM scenes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
