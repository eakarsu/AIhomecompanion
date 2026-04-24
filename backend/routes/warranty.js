const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM warranties ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM warranties WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { item_name, type, provider, policy_number, start_date, end_date, coverage_amount, premium, deductible, status, contact_phone, notes, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO warranties (item_name, type, provider, policy_number, start_date, end_date, coverage_amount, premium, deductible, status, contact_phone, notes, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
      [item_name, type, provider, policy_number, start_date, end_date, coverage_amount, premium, deductible, status, contact_phone, notes, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { item_name, type, provider, policy_number, start_date, end_date, coverage_amount, premium, deductible, status, contact_phone, notes, icon } = req.body;
    const result = await pool.query(
      'UPDATE warranties SET item_name=$1, type=$2, provider=$3, policy_number=$4, start_date=$5, end_date=$6, coverage_amount=$7, premium=$8, deductible=$9, status=$10, contact_phone=$11, notes=$12, icon=$13 WHERE id=$14 RETURNING *',
      [item_name, type, provider, policy_number, start_date, end_date, coverage_amount, premium, deductible, status, contact_phone, notes, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM warranties WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
