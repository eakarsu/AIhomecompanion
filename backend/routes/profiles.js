const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_profiles ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_profiles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, role, avatar, preferences, voice_id, age, relation, is_home } = req.body;
    const result = await pool.query(
      'INSERT INTO user_profiles (name, role, avatar, preferences, voice_id, age, relation, is_home, last_seen) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *',
      [name, role, avatar || '👤', JSON.stringify(preferences || {}), voice_id, age, relation, is_home || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, role, avatar, preferences, voice_id, age, relation, is_home } = req.body;
    const result = await pool.query(
      'UPDATE user_profiles SET name=$1, role=$2, avatar=$3, preferences=$4, voice_id=$5, age=$6, relation=$7, is_home=$8, last_seen=NOW() WHERE id=$9 RETURNING *',
      [name, role, avatar, JSON.stringify(preferences || {}), voice_id, age, relation, is_home, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM user_profiles WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
