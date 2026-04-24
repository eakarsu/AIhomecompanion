const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budget_entries ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budget_entries WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, category, amount, type, date, payment_method, vendor, is_recurring, frequency, notes, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO budget_entries (title, category, amount, type, date, payment_method, vendor, is_recurring, frequency, notes, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [title, category, amount, type, date, payment_method, vendor, is_recurring, frequency, notes, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, category, amount, type, date, payment_method, vendor, is_recurring, frequency, notes, icon } = req.body;
    const result = await pool.query(
      'UPDATE budget_entries SET title=$1, category=$2, amount=$3, type=$4, date=$5, payment_method=$6, vendor=$7, is_recurring=$8, frequency=$9, notes=$10, icon=$11 WHERE id=$12 RETURNING *',
      [title, category, amount, type, date, payment_method, vendor, is_recurring, frequency, notes, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM budget_entries WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
