const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recommendations ORDER BY ai_confidence DESC, id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recommendations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, priority, potential_savings, difficulty, status, ai_confidence, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO recommendations (title, description, category, priority, potential_savings, difficulty, status, ai_confidence, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title, description, category, priority, potential_savings || 0, difficulty, status || 'pending', ai_confidence || 0.8, icon || '💡']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, category, priority, potential_savings, difficulty, status, ai_confidence, icon } = req.body;
    const result = await pool.query(
      'UPDATE recommendations SET title=$1, description=$2, category=$3, priority=$4, potential_savings=$5, difficulty=$6, status=$7, ai_confidence=$8, icon=$9 WHERE id=$10 RETURNING *',
      [title, description, category, priority, potential_savings, difficulty, status, ai_confidence, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM recommendations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
