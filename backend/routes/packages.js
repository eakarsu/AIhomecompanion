const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM packages ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM packages WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { description, carrier, tracking_number, order_date, expected_delivery, actual_delivery, status, recipient, retailer, notes, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO packages (description, carrier, tracking_number, order_date, expected_delivery, actual_delivery, status, recipient, retailer, notes, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [description, carrier, tracking_number, order_date, expected_delivery, actual_delivery, status, recipient, retailer, notes, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { description, carrier, tracking_number, order_date, expected_delivery, actual_delivery, status, recipient, retailer, notes, icon } = req.body;
    const result = await pool.query(
      'UPDATE packages SET description=$1, carrier=$2, tracking_number=$3, order_date=$4, expected_delivery=$5, actual_delivery=$6, status=$7, recipient=$8, retailer=$9, notes=$10, icon=$11 WHERE id=$12 RETURNING *',
      [description, carrier, tracking_number, order_date, expected_delivery, actual_delivery, status, recipient, retailer, notes, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM packages WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
