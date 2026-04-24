const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM analytics ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM analytics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { metric_name, category, value, unit, period, trend, change_percent, details, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO analytics (metric_name, category, value, unit, period, trend, change_percent, details, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [metric_name, category, value, unit, period, trend, change_percent, JSON.stringify(details || {}), icon || '📊']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { metric_name, category, value, unit, period, trend, change_percent, details, icon } = req.body;
    const result = await pool.query(
      'UPDATE analytics SET metric_name=$1, category=$2, value=$3, unit=$4, period=$5, trend=$6, change_percent=$7, details=$8, icon=$9 WHERE id=$10 RETURNING *',
      [metric_name, category, value, unit, period, trend, change_percent, JSON.stringify(details || {}), icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM analytics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
