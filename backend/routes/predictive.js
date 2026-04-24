const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM predictive_maintenance ORDER BY failure_probability DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM predictive_maintenance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { device_name, device_id, predicted_issue, failure_probability, predicted_date, severity, recommendation, estimated_cost, status, ai_model, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO predictive_maintenance (device_name, device_id, predicted_issue, failure_probability, predicted_date, severity, recommendation, estimated_cost, status, ai_model, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [device_name, device_id, predicted_issue, failure_probability, predicted_date, severity, recommendation, estimated_cost, status, ai_model, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { device_name, device_id, predicted_issue, failure_probability, predicted_date, severity, recommendation, estimated_cost, status, ai_model, icon } = req.body;
    const result = await pool.query(
      `UPDATE predictive_maintenance SET device_name=$1, device_id=$2, predicted_issue=$3, failure_probability=$4, predicted_date=$5, severity=$6, recommendation=$7, estimated_cost=$8, status=$9, ai_model=$10, icon=$11
       WHERE id=$12 RETURNING *`,
      [device_name, device_id, predicted_issue, failure_probability, predicted_date, severity, recommendation, estimated_cost, status, ai_model, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM predictive_maintenance WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
