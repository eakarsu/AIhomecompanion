const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM robot_tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM robot_tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { task_name, description, task_type, priority, status, assigned_robot, scheduled_at, started_at, completed_at, result: taskResult, icon } = req.body;
    const queryResult = await pool.query(
      `INSERT INTO robot_tasks (task_name, description, task_type, priority, status, assigned_robot, scheduled_at, started_at, completed_at, result, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [task_name, description, task_type, priority, status, assigned_robot, scheduled_at, started_at, completed_at, taskResult, icon]
    );
    res.status(201).json(queryResult.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { task_name, description, task_type, priority, status, assigned_robot, scheduled_at, started_at, completed_at, result: taskResult, icon } = req.body;
    const queryResult = await pool.query(
      `UPDATE robot_tasks SET task_name=$1, description=$2, task_type=$3, priority=$4, status=$5, assigned_robot=$6, scheduled_at=$7, started_at=$8, completed_at=$9, result=$10, icon=$11
       WHERE id=$12 RETURNING *`,
      [task_name, description, task_type, priority, status, assigned_robot, scheduled_at, started_at, completed_at, taskResult, icon, req.params.id]
    );
    if (queryResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(queryResult.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM robot_tasks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
