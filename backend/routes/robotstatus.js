const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM robot_status ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM robot_status WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { robot_name, battery_level, status, current_location, cpu_usage, memory_usage, temperature_celsius, uptime_hours, last_charged, firmware_version, health_score, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO robot_status (robot_name, battery_level, status, current_location, cpu_usage, memory_usage, temperature_celsius, uptime_hours, last_charged, firmware_version, health_score, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [robot_name, battery_level, status, current_location, cpu_usage, memory_usage, temperature_celsius, uptime_hours, last_charged, firmware_version, health_score, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { robot_name, battery_level, status, current_location, cpu_usage, memory_usage, temperature_celsius, uptime_hours, last_charged, firmware_version, health_score, icon } = req.body;
    const result = await pool.query(
      `UPDATE robot_status SET robot_name=$1, battery_level=$2, status=$3, current_location=$4, cpu_usage=$5, memory_usage=$6, temperature_celsius=$7, uptime_hours=$8, last_charged=$9, firmware_version=$10, health_score=$11, icon=$12
       WHERE id=$13 RETURNING *`,
      [robot_name, battery_level, status, current_location, cpu_usage, memory_usage, temperature_celsius, uptime_hours, last_charged, firmware_version, health_score, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM robot_status WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
