const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT a.*, r.name as room_name FROM automations a LEFT JOIN rooms r ON a.room_id = r.id ORDER BY a.id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT a.*, r.name as room_name FROM automations a LEFT JOIN rooms r ON a.room_id = r.id WHERE a.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, trigger_type, trigger_value, action_type, action_value, is_active, room_id, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO automations (name, description, trigger_type, trigger_value, action_type, action_value, is_active, room_id, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, description, trigger_type, trigger_value, action_type, action_value, is_active !== false, room_id, icon || '⚡']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, trigger_type, trigger_value, action_type, action_value, is_active, room_id, icon } = req.body;
    const result = await pool.query(
      'UPDATE automations SET name=$1, description=$2, trigger_type=$3, trigger_value=$4, action_type=$5, action_value=$6, is_active=$7, room_id=$8, icon=$9 WHERE id=$10 RETURNING *',
      [name, description, trigger_type, trigger_value, action_type, action_value, is_active, room_id, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM automations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
