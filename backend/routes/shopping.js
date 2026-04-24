const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shopping_items ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shopping_items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, category, quantity, unit, store, estimated_price, is_purchased, priority, added_by, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO shopping_items (name, category, quantity, unit, store, estimated_price, is_purchased, priority, added_by, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [name, category, quantity, unit, store, estimated_price, is_purchased, priority, added_by, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, quantity, unit, store, estimated_price, is_purchased, priority, added_by, icon } = req.body;
    const result = await pool.query(
      'UPDATE shopping_items SET name=$1, category=$2, quantity=$3, unit=$4, store=$5, estimated_price=$6, is_purchased=$7, priority=$8, added_by=$9, icon=$10 WHERE id=$11 RETURNING *',
      [name, category, quantity, unit, store, estimated_price, is_purchased, priority, added_by, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM shopping_items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
