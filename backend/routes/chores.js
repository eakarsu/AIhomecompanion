const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT c.*, r.name AS room_name FROM chores c LEFT JOIN rooms r ON c.room_id = r.id ORDER BY c.id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT c.*, r.name AS room_name FROM chores c LEFT JOIN rooms r ON c.room_id = r.id WHERE c.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, assigned_to, room_id, frequency, priority, status, due_date, completed_date, points, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO chores (title, description, assigned_to, room_id, frequency, priority, status, due_date, completed_date, points, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [title, description, assigned_to, room_id, frequency, priority, status, due_date, completed_date, points, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, assigned_to, room_id, frequency, priority, status, due_date, completed_date, points, icon } = req.body;
    const result = await pool.query(
      'UPDATE chores SET title=$1, description=$2, assigned_to=$3, room_id=$4, frequency=$5, priority=$6, status=$7, due_date=$8, completed_date=$9, points=$10, icon=$11 WHERE id=$12 RETURNING *',
      [title, description, assigned_to, room_id, frequency, priority, status, due_date, completed_date, points, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM chores WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
