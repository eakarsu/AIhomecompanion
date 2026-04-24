const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ge.*, r.name AS room_name
       FROM gesture_events ge
       LEFT JOIN rooms r ON ge.room_id = r.id
       ORDER BY ge.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ge.*, r.name AS room_name
       FROM gesture_events ge
       LEFT JOIN rooms r ON ge.room_id = r.id
       WHERE ge.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { gesture_name, person, confidence, action_triggered, room_id, camera_id, status, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO gesture_events (gesture_name, person, confidence, action_triggered, room_id, camera_id, status, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [gesture_name, person, confidence, action_triggered, room_id, camera_id, status, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { gesture_name, person, confidence, action_triggered, room_id, camera_id, status, icon } = req.body;
    const result = await pool.query(
      `UPDATE gesture_events SET gesture_name=$1, person=$2, confidence=$3, action_triggered=$4, room_id=$5, camera_id=$6, status=$7, icon=$8
       WHERE id=$9 RETURNING *`,
      [gesture_name, person, confidence, action_triggered, room_id, camera_id, status, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM gesture_events WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
