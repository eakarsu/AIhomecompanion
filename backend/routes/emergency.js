const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergency_contacts ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergency_contacts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, relationship, phone, alt_phone, email, address, type, priority, notes, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO emergency_contacts (name, relationship, phone, alt_phone, email, address, type, priority, notes, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [name, relationship, phone, alt_phone, email, address, type, priority, notes, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, relationship, phone, alt_phone, email, address, type, priority, notes, icon } = req.body;
    const result = await pool.query(
      'UPDATE emergency_contacts SET name=$1, relationship=$2, phone=$3, alt_phone=$4, email=$5, address=$6, type=$7, priority=$8, notes=$9, icon=$10 WHERE id=$11 RETURNING *',
      [name, relationship, phone, alt_phone, email, address, type, priority, notes, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM emergency_contacts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
