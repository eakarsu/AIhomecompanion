const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vc.*, r.name AS room_name
       FROM voice_commands vc
       LEFT JOIN rooms r ON vc.room_id = r.id
       ORDER BY vc.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vc.*, r.name AS room_name
       FROM voice_commands vc
       LEFT JOIN rooms r ON vc.room_id = r.id
       WHERE vc.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { command_text, intent, confidence, speaker, room_id, action_taken, status, response_text, processing_time_ms, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO voice_commands (command_text, intent, confidence, speaker, room_id, action_taken, status, response_text, processing_time_ms, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [command_text, intent, confidence, speaker, room_id, action_taken, status, response_text, processing_time_ms, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { command_text, intent, confidence, speaker, room_id, action_taken, status, response_text, processing_time_ms, icon } = req.body;
    const result = await pool.query(
      `UPDATE voice_commands SET command_text=$1, intent=$2, confidence=$3, speaker=$4, room_id=$5, action_taken=$6, status=$7, response_text=$8, processing_time_ms=$9, icon=$10
       WHERE id=$11 RETURNING *`,
      [command_text, intent, confidence, speaker, room_id, action_taken, status, response_text, processing_time_ms, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM voice_commands WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
