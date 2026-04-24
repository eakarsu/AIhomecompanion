const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT d.*, r.name as room_name FROM devices d LEFT JOIN rooms r ON d.room_id = r.id ORDER BY d.id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT d.*, r.name as room_name FROM devices d LEFT JOIN rooms r ON d.room_id = r.id WHERE d.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, type, brand, model, room_id, status, ip_address, firmware, battery_level, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO devices (name, type, brand, model, room_id, status, ip_address, firmware, battery_level, last_active, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10) RETURNING *',
      [name, type, brand, model, room_id, status || 'online', ip_address, firmware, battery_level, icon || '📱']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, brand, model, room_id, status, ip_address, firmware, battery_level, icon } = req.body;
    const result = await pool.query(
      'UPDATE devices SET name=$1, type=$2, brand=$3, model=$4, room_id=$5, status=$6, ip_address=$7, firmware=$8, battery_level=$9, icon=$10 WHERE id=$11 RETURNING *',
      [name, type, brand, model, room_id, status, ip_address, firmware, battery_level, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM devices WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
