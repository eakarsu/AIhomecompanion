const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.*, r.name AS room_name
       FROM companion_interactions ci
       LEFT JOIN rooms r ON ci.room_id = r.id
       ORDER BY ci.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.*, r.name AS room_name
       FROM companion_interactions ci
       LEFT JOIN rooms r ON ci.room_id = r.id
       WHERE ci.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { interaction_type, person, content, category, duration_min, mood_before, mood_after, rating, room_id, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO companion_interactions (interaction_type, person, content, category, duration_min, mood_before, mood_after, rating, room_id, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [interaction_type, person, content, category, duration_min, mood_before, mood_after, rating, room_id, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { interaction_type, person, content, category, duration_min, mood_before, mood_after, rating, room_id, icon } = req.body;
    const result = await pool.query(
      `UPDATE companion_interactions SET interaction_type=$1, person=$2, content=$3, category=$4, duration_min=$5, mood_before=$6, mood_after=$7, rating=$8, room_id=$9, icon=$10
       WHERE id=$11 RETURNING *`,
      [interaction_type, person, content, category, duration_min, mood_before, mood_after, rating, room_id, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM companion_interactions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
