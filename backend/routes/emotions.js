const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT er.*, r.name AS room_name
       FROM emotion_readings er
       LEFT JOIN rooms r ON er.room_id = r.id
       ORDER BY er.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT er.*, r.name AS room_name
       FROM emotion_readings er
       LEFT JOIN rooms r ON er.room_id = r.id
       WHERE er.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { person, emotion, confidence, secondary_emotion, room_id, context, action_suggested, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO emotion_readings (person, emotion, confidence, secondary_emotion, room_id, context, action_suggested, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [person, emotion, confidence, secondary_emotion, room_id, context, action_suggested, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { person, emotion, confidence, secondary_emotion, room_id, context, action_suggested, icon } = req.body;
    const result = await pool.query(
      `UPDATE emotion_readings SET person=$1, emotion=$2, confidence=$3, secondary_emotion=$4, room_id=$5, context=$6, action_suggested=$7, icon=$8
       WHERE id=$9 RETURNING *`,
      [person, emotion, confidence, secondary_emotion, room_id, context, action_suggested, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM emotion_readings WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
