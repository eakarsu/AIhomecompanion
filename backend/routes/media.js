const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT m.*, r.name AS room_name FROM media_sessions m LEFT JOIN rooms r ON m.room_id = r.id ORDER BY m.id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT m.*, r.name AS room_name FROM media_sessions m LEFT JOIN rooms r ON m.room_id = r.id WHERE m.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, artist, album, media_type, source, room_id, device_id, volume, status, duration_sec, playlist, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO media_sessions (title, artist, album, media_type, source, room_id, device_id, volume, status, duration_sec, playlist, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [title, artist, album, media_type, source, room_id, device_id, volume, status, duration_sec, playlist, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, artist, album, media_type, source, room_id, device_id, volume, status, duration_sec, playlist, icon } = req.body;
    const result = await pool.query(
      'UPDATE media_sessions SET title=$1, artist=$2, album=$3, media_type=$4, source=$5, room_id=$6, device_id=$7, volume=$8, status=$9, duration_sec=$10, playlist=$11, icon=$12 WHERE id=$13 RETURNING *',
      [title, artist, album, media_type, source, room_id, device_id, volume, status, duration_sec, playlist, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM media_sessions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
