const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plants ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, species, location, sunlight_needs, water_frequency, last_watered, next_water, last_fertilized, health_status, notes, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO plants (name, species, location, sunlight_needs, water_frequency, last_watered, next_water, last_fertilized, health_status, notes, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [name, species, location, sunlight_needs, water_frequency, last_watered, next_water, last_fertilized, health_status, notes, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, species, location, sunlight_needs, water_frequency, last_watered, next_water, last_fertilized, health_status, notes, icon } = req.body;
    const result = await pool.query(
      'UPDATE plants SET name=$1, species=$2, location=$3, sunlight_needs=$4, water_frequency=$5, last_watered=$6, next_water=$7, last_fertilized=$8, health_status=$9, notes=$10, icon=$11 WHERE id=$12 RETURNING *',
      [name, species, location, sunlight_needs, water_frequency, last_watered, next_water, last_fertilized, health_status, notes, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM plants WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
