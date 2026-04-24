const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT g.*, r.name AS room_name FROM guests g LEFT JOIN rooms r ON g.room_id = r.id ORDER BY g.id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT g.*, r.name AS room_name FROM guests g LEFT JOIN rooms r ON g.room_id = r.id WHERE g.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, relationship, phone, email, visit_date, departure_date, room_id, wifi_access, dietary_restrictions, notes, status, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO guests (name, relationship, phone, email, visit_date, departure_date, room_id, wifi_access, dietary_restrictions, notes, status, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [name, relationship, phone, email, visit_date, departure_date, room_id, wifi_access, dietary_restrictions, notes, status, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, relationship, phone, email, visit_date, departure_date, room_id, wifi_access, dietary_restrictions, notes, status, icon } = req.body;
    const result = await pool.query(
      'UPDATE guests SET name=$1, relationship=$2, phone=$3, email=$4, visit_date=$5, departure_date=$6, room_id=$7, wifi_access=$8, dietary_restrictions=$9, notes=$10, status=$11, icon=$12 WHERE id=$13 RETURNING *',
      [name, relationship, phone, email, visit_date, departure_date, room_id, wifi_access, dietary_restrictions, notes, status, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM guests WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
