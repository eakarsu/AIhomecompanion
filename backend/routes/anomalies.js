const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, r.name AS room_name
       FROM anomalies a
       LEFT JOIN rooms r ON a.room_id = r.id
       ORDER BY a.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, r.name AS room_name
       FROM anomalies a
       LEFT JOIN rooms r ON a.room_id = r.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, type, severity, source, description, room_id, device_id, confidence, is_resolved, action_taken, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO anomalies (title, type, severity, source, description, room_id, device_id, confidence, is_resolved, action_taken, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, type, severity, source, description, room_id, device_id, confidence, is_resolved, action_taken, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, type, severity, source, description, room_id, device_id, confidence, is_resolved, action_taken, icon } = req.body;
    const result = await pool.query(
      `UPDATE anomalies SET title=$1, type=$2, severity=$3, source=$4, description=$5, room_id=$6, device_id=$7, confidence=$8, is_resolved=$9, action_taken=$10, icon=$11
       WHERE id=$12 RETURNING *`,
      [title, type, severity, source, description, room_id, device_id, confidence, is_resolved, action_taken, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM anomalies WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
