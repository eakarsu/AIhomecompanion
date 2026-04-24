const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meal_plans ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meal_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { meal_name, meal_type, date, recipe_id, servings, calories, prep_time_min, dietary_tags, ai_suggested, status, notes, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO meal_plans (meal_name, meal_type, date, recipe_id, servings, calories, prep_time_min, dietary_tags, ai_suggested, status, notes, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [meal_name, meal_type, date, recipe_id, servings, calories, prep_time_min, dietary_tags, ai_suggested, status, notes, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { meal_name, meal_type, date, recipe_id, servings, calories, prep_time_min, dietary_tags, ai_suggested, status, notes, icon } = req.body;
    const result = await pool.query(
      `UPDATE meal_plans SET meal_name=$1, meal_type=$2, date=$3, recipe_id=$4, servings=$5, calories=$6, prep_time_min=$7, dietary_tags=$8, ai_suggested=$9, status=$10, notes=$11, icon=$12
       WHERE id=$13 RETURNING *`,
      [meal_name, meal_type, date, recipe_id, servings, calories, prep_time_min, dietary_tags, ai_suggested, status, notes, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM meal_plans WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
