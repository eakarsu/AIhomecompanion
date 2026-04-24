const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM face_records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM face_records WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { person_name, profile_id, confidence, location, camera_id, is_recognized, emotion, access_granted, image_ref, icon } = req.body;
    const result = await pool.query(
      `INSERT INTO face_records (person_name, profile_id, confidence, location, camera_id, is_recognized, emotion, access_granted, image_ref, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [person_name, profile_id, confidence, location, camera_id, is_recognized, emotion, access_granted, image_ref, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { person_name, profile_id, confidence, location, camera_id, is_recognized, emotion, access_granted, image_ref, icon } = req.body;
    const result = await pool.query(
      `UPDATE face_records SET person_name=$1, profile_id=$2, confidence=$3, location=$4, camera_id=$5, is_recognized=$6, emotion=$7, access_granted=$8, image_ref=$9, icon=$10
       WHERE id=$11 RETURNING *`,
      [person_name, profile_id, confidence, location, camera_id, is_recognized, emotion, access_granted, image_ref, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM face_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
