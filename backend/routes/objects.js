const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT do.*, r.name AS room_name
       FROM detected_objects do
       LEFT JOIN rooms r ON do.room_id = r.id
       ORDER BY do.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT do.*, r.name AS room_name
       FROM detected_objects do
       LEFT JOIN rooms r ON do.room_id = r.id
       WHERE do.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { object_name, category, confidence, location, room_id, camera_id, bounding_box, is_anomaly, action_taken, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO detected_objects (object_name, category, confidence, location, room_id, camera_id, bounding_box, is_anomaly, action_taken, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [object_name, category, confidence, location, room_id, camera_id, bounding_box, is_anomaly, action_taken, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { object_name, category, confidence, location, room_id, camera_id, bounding_box, is_anomaly, action_taken, icon } = req.body;
    const result = await pool.query(
      `UPDATE detected_objects SET object_name=$1, category=$2, confidence=$3, location=$4, room_id=$5, camera_id=$6, bounding_box=$7, is_anomaly=$8, action_taken=$9, icon=$10
       WHERE id=$11 RETURNING *`,
      [object_name, category, confidence, location, room_id, camera_id, bounding_box, is_anomaly, action_taken, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM detected_objects WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
