const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM calendar_events ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM calendar_events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, event_date, start_time, end_time, location, category, recurrence, assigned_to, is_all_day, reminder_minutes, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO calendar_events (title, description, event_date, start_time, end_time, location, category, recurrence, assigned_to, is_all_day, reminder_minutes, icon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [title, description, event_date, start_time, end_time, location, category, recurrence, assigned_to, is_all_day, reminder_minutes, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, event_date, start_time, end_time, location, category, recurrence, assigned_to, is_all_day, reminder_minutes, icon } = req.body;
    const result = await pool.query(
      'UPDATE calendar_events SET title=$1, description=$2, event_date=$3, start_time=$4, end_time=$5, location=$6, category=$7, recurrence=$8, assigned_to=$9, is_all_day=$10, reminder_minutes=$11, icon=$12 WHERE id=$13 RETURNING *',
      [title, description, event_date, start_time, end_time, location, category, recurrence, assigned_to, is_all_day, reminder_minutes, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM calendar_events WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
