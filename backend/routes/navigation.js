const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT nl.*, r.name AS room_name
       FROM navigation_logs nl
       LEFT JOIN rooms r ON nl.room_id = r.id
       ORDER BY nl.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT nl.*, r.name AS room_name
       FROM navigation_logs nl
       LEFT JOIN rooms r ON nl.room_id = r.id
       WHERE nl.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { destination, from_location, room_id, status, distance_meters, duration_sec, obstacles_avoided, map_version, path_data, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO navigation_logs (destination, from_location, room_id, status, distance_meters, duration_sec, obstacles_avoided, map_version, path_data, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [destination, from_location, room_id, status, distance_meters, duration_sec, obstacles_avoided, map_version, path_data, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { destination, from_location, room_id, status, distance_meters, duration_sec, obstacles_avoided, map_version, path_data, icon } = req.body;
    const result = await pool.query(
      `UPDATE navigation_logs SET destination=$1, from_location=$2, room_id=$3, status=$4, distance_meters=$5, duration_sec=$6, obstacles_avoided=$7, map_version=$8, path_data=$9, icon=$10
       WHERE id=$11 RETURNING *`,
      [destination, from_location, room_id, status, distance_meters, duration_sec, obstacles_avoided, map_version, path_data, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM navigation_logs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
