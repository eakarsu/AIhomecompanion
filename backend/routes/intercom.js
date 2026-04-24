const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM intercom_messages ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM intercom_messages WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { from_room_id, to_room_id, from_room, to_room, sender, message, type, is_read, priority, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO intercom_messages (from_room_id, to_room_id, from_room, to_room, sender, message, type, is_read, priority, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [from_room_id, to_room_id, from_room, to_room, sender, message, type, is_read, priority, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { from_room_id, to_room_id, from_room, to_room, sender, message, type, is_read, priority, icon } = req.body;
    const result = await pool.query(
      'UPDATE intercom_messages SET from_room_id=$1, to_room_id=$2, from_room=$3, to_room=$4, sender=$5, message=$6, type=$7, is_read=$8, priority=$9, icon=$10 WHERE id=$11 RETURNING *',
      [from_room_id, to_room_id, from_room, to_room, sender, message, type, is_read, priority, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM intercom_messages WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
