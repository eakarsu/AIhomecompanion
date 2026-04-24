const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM laundry_loads ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM laundry_loads WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { label, load_type, machine, status, started_at, estimated_done, temperature, cycle_type, assigned_to, notes, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO laundry_loads (label, load_type, machine, status, started_at, estimated_done, temperature, cycle_type, assigned_to, notes, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [label, load_type, machine, status, started_at, estimated_done, temperature, cycle_type, assigned_to, notes, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { label, load_type, machine, status, started_at, estimated_done, temperature, cycle_type, assigned_to, notes, icon } = req.body;
    const result = await pool.query(
      'UPDATE laundry_loads SET label=$1, load_type=$2, machine=$3, status=$4, started_at=$5, estimated_done=$6, temperature=$7, cycle_type=$8, assigned_to=$9, notes=$10, icon=$11 WHERE id=$12 RETURNING *',
      [label, load_type, machine, status, started_at, estimated_done, temperature, cycle_type, assigned_to, notes, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM laundry_loads WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
