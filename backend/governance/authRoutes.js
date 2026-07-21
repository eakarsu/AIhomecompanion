'use strict';

const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticate, assertAuthConfiguration } = require('./auth');

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    tenantId: row.tenant_id,
    profileId: row.profile_id,
    profileName: row.display_name,
    role: row.role,
  };
}

function createAuthRouter(pool, env = process.env) {
  assertAuthConfiguration(env);
  const router = express.Router();

  router.post('/login', async (req, res, next) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      if (!email || !password) return res.status(400).json({ error: 'email_and_password_required' });

      const result = await pool.query(
        `SELECT u.id,u.email,u.password_hash,m.tenant_id,m.profile_id,m.role,p.display_name
           FROM companion_users u
           JOIN companion_memberships m ON m.user_id=u.id AND m.status='active'
           JOIN companion_profiles p ON p.id=m.profile_id AND p.tenant_id=m.tenant_id AND p.status='active'
           JOIN companion_households h ON h.id=m.tenant_id AND h.status='active'
          WHERE lower(u.email)=$1 AND u.status='active'
          ORDER BY m.created_at
          LIMIT 1`,
        [email],
      );
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'invalid_credentials' });
      }

      const token = jwt.sign(
        { tenant_id: user.tenant_id, profile_id: user.profile_id, role: user.role },
        env.JWT_SECRET,
        { subject: user.id, issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, algorithm: 'HS256', expiresIn: '1h' },
      );
      return res.json({ token, user: publicUser(user) });
    } catch (error) { return next(error); }
  });

  router.get('/me', authenticate(pool, env), async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT u.id,u.email,m.tenant_id,m.profile_id,m.role,p.display_name
           FROM companion_users u
           JOIN companion_memberships m ON m.user_id=u.id AND m.tenant_id=$2 AND m.profile_id=$3 AND m.status='active'
           JOIN companion_profiles p ON p.id=m.profile_id AND p.tenant_id=m.tenant_id AND p.status='active'
          WHERE u.id=$1 AND u.status='active'`,
        [req.auth.userId, req.auth.tenantId, req.auth.profileId],
      );
      if (!result.rowCount) return res.status(401).json({ error: 'session_not_found' });
      return res.json({ user: publicUser(result.rows[0]) });
    } catch (error) { return next(error); }
  });

  return router;
}

module.exports = { createAuthRouter };
