const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recipes ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recipes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, cuisine, category, prep_time_min, cook_time_min, servings, difficulty, instructions, calories, rating, is_favorite, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO recipes (name, description, cuisine, category, prep_time_min, cook_time_min, servings, difficulty, instructions, calories, rating, is_favorite, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
      [name, description, cuisine, category, prep_time_min, cook_time_min, servings, difficulty, instructions, calories, rating, is_favorite, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, cuisine, category, prep_time_min, cook_time_min, servings, difficulty, instructions, calories, rating, is_favorite, icon } = req.body;
    const result = await pool.query(
      'UPDATE recipes SET name=$1, description=$2, cuisine=$3, category=$4, prep_time_min=$5, cook_time_min=$6, servings=$7, difficulty=$8, instructions=$9, calories=$10, rating=$11, is_favorite=$12, icon=$13 WHERE id=$14 RETURNING *',
      [name, description, cuisine, category, prep_time_min, cook_time_min, servings, difficulty, instructions, calories, rating, is_favorite, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM recipes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
