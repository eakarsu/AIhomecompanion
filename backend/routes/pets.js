const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pets ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, species, breed, age_years, weight, vet_name, vet_phone, next_vet_visit, feeding_schedule, medications, notes, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO pets (name, species, breed, age_years, weight, vet_name, vet_phone, next_vet_visit, feeding_schedule, medications, notes, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [name, species, breed, age_years, weight, vet_name, vet_phone, next_vet_visit, feeding_schedule, medications, notes, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, species, breed, age_years, weight, vet_name, vet_phone, next_vet_visit, feeding_schedule, medications, notes, icon } = req.body;
    const result = await pool.query(
      'UPDATE pets SET name=$1, species=$2, breed=$3, age_years=$4, weight=$5, vet_name=$6, vet_phone=$7, next_vet_visit=$8, feeding_schedule=$9, medications=$10, notes=$11, icon=$12 WHERE id=$13 RETURNING *',
      [name, species, breed, age_years, weight, vet_name, vet_phone, next_vet_visit, feeding_schedule, medications, notes, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pets WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
