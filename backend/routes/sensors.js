const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT s.*, r.name as room_name FROM sensors s LEFT JOIN rooms r ON s.room_id = r.id ORDER BY s.id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT s.*, r.name as room_name FROM sensors s LEFT JOIN rooms r ON s.room_id = r.id WHERE s.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, type, room_id, value, unit, min_threshold, max_threshold, status, battery_level, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO sensors (name, type, room_id, value, unit, min_threshold, max_threshold, status, battery_level, last_reading, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10) RETURNING *',
      [name, type, room_id, value, unit, min_threshold, max_threshold, status || 'normal', battery_level, icon || '📡']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, room_id, value, unit, min_threshold, max_threshold, status, battery_level, icon } = req.body;
    const result = await pool.query(
      'UPDATE sensors SET name=$1, type=$2, room_id=$3, value=$4, unit=$5, min_threshold=$6, max_threshold=$7, status=$8, battery_level=$9, icon=$10, last_reading=NOW() WHERE id=$11 RETURNING *',
      [name, type, room_id, value, unit, min_threshold, max_threshold, status, battery_level, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sensors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
