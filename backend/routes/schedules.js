const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT s.*, r.name as room_name FROM schedules s LEFT JOIN rooms r ON s.room_id = r.id ORDER BY s.id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT s.*, r.name as room_name FROM schedules s LEFT JOIN rooms r ON s.room_id = r.id WHERE s.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, cron_expression, action_type, action_value, device_id, room_id, is_active, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO schedules (name, description, cron_expression, action_type, action_value, device_id, room_id, is_active, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, description, cron_expression, action_type, action_value, device_id, room_id, is_active !== false, icon || '⏰']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, cron_expression, action_type, action_value, device_id, room_id, is_active, icon } = req.body;
    const result = await pool.query(
      'UPDATE schedules SET name=$1, description=$2, cron_expression=$3, action_type=$4, action_value=$5, device_id=$6, room_id=$7, is_active=$8, icon=$9 WHERE id=$10 RETURNING *',
      [name, description, cron_expression, action_type, action_value, device_id, room_id, is_active, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM schedules WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
