const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sleep_records ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sleep_records WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { person, date, bedtime, wake_time, duration_hours, quality_score, deep_sleep_pct, rem_sleep_pct, disturbances, room_temperature, ai_recommendation, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO sleep_records (person, date, bedtime, wake_time, duration_hours, quality_score, deep_sleep_pct, rem_sleep_pct, disturbances, room_temperature, ai_recommendation, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [person, date, bedtime, wake_time, duration_hours, quality_score, deep_sleep_pct, rem_sleep_pct, disturbances, room_temperature, ai_recommendation, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { person, date, bedtime, wake_time, duration_hours, quality_score, deep_sleep_pct, rem_sleep_pct, disturbances, room_temperature, ai_recommendation, icon } = req.body;
    const result = await pool.query(
      `UPDATE sleep_records SET person=$1, date=$2, bedtime=$3, wake_time=$4, duration_hours=$5, quality_score=$6, deep_sleep_pct=$7, rem_sleep_pct=$8, disturbances=$9, room_temperature=$10, ai_recommendation=$11, icon=$12
       WHERE id=$13 RETURNING *`,
      [person, date, bedtime, wake_time, duration_hours, quality_score, deep_sleep_pct, rem_sleep_pct, disturbances, room_temperature, ai_recommendation, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sleep_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
