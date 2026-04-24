const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM weather_data ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM weather_data WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { location, date, temperature, feels_like, humidity, wind_speed, condition, forecast_high, forecast_low, uv_index, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO weather_data (location, date, temperature, feels_like, humidity, wind_speed, condition, forecast_high, forecast_low, uv_index, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [location, date, temperature, feels_like, humidity, wind_speed, condition, forecast_high, forecast_low, uv_index, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { location, date, temperature, feels_like, humidity, wind_speed, condition, forecast_high, forecast_low, uv_index, icon } = req.body;
    const result = await pool.query(
      'UPDATE weather_data SET location=$1, date=$2, temperature=$3, feels_like=$4, humidity=$5, wind_speed=$6, condition=$7, forecast_high=$8, forecast_low=$9, uv_index=$10, icon=$11 WHERE id=$12 RETURNING *',
      [location, date, temperature, feels_like, humidity, wind_speed, condition, forecast_high, forecast_low, uv_index, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM weather_data WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
