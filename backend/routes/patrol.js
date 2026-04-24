const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patrol_rounds ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patrol_rounds WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, route, schedule, status, started_at, completed_at, rooms_checked, anomalies_found, report, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO patrol_rounds (name, route, schedule, status, started_at, completed_at, rooms_checked, anomalies_found, report, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, route, schedule, status, started_at, completed_at, rooms_checked, anomalies_found, report, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, route, schedule, status, started_at, completed_at, rooms_checked, anomalies_found, report, icon } = req.body;
    const result = await pool.query(
      `UPDATE patrol_rounds SET name=$1, route=$2, schedule=$3, status=$4, started_at=$5, completed_at=$6, rooms_checked=$7, anomalies_found=$8, report=$9, icon=$10
       WHERE id=$11 RETURNING *`,
      [name, route, schedule, status, started_at, completed_at, rooms_checked, anomalies_found, report, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM patrol_rounds WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
