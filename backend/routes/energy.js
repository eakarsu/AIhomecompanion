const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM energy_logs ORDER BY date DESC, id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM energy_logs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { device_id, device_name, consumption_kwh, cost_usd, date, peak_watts, category, efficiency_rating } = req.body;
    const result = await pool.query(
      'INSERT INTO energy_logs (device_id, device_name, consumption_kwh, cost_usd, date, peak_watts, category, efficiency_rating) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [device_id, device_name, consumption_kwh, cost_usd, date || new Date(), peak_watts, category, efficiency_rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { device_id, device_name, consumption_kwh, cost_usd, date, peak_watts, category, efficiency_rating } = req.body;
    const result = await pool.query(
      'UPDATE energy_logs SET device_id=$1, device_name=$2, consumption_kwh=$3, cost_usd=$4, date=$5, peak_watts=$6, category=$7, efficiency_rating=$8 WHERE id=$9 RETURNING *',
      [device_id, device_name, consumption_kwh, cost_usd, date, peak_watts, category, efficiency_rating, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM energy_logs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
