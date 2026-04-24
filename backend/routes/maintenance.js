const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance_logs ORDER BY scheduled_date DESC, id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance_logs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { device_id, device_name, type, description, status, scheduled_date, completed_date, cost, technician, priority, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO maintenance_logs (device_id, device_name, type, description, status, scheduled_date, completed_date, cost, technician, priority, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [device_id, device_name, type, description, status || 'pending', scheduled_date, completed_date, cost || 0, technician, priority || 'medium', icon || '🔧']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { device_id, device_name, type, description, status, scheduled_date, completed_date, cost, technician, priority, icon } = req.body;
    const result = await pool.query(
      'UPDATE maintenance_logs SET device_id=$1, device_name=$2, type=$3, description=$4, status=$5, scheduled_date=$6, completed_date=$7, cost=$8, technician=$9, priority=$10, icon=$11 WHERE id=$12 RETURNING *',
      [device_id, device_name, type, description, status, scheduled_date, completed_date, cost, technician, priority, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM maintenance_logs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
