'use strict';

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const { createPool } = require('../db');

async function main(env = process.env) {
  if (env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') {
    throw new Error('BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin is required');
  }
  const email = String(env.PROVISION_ADMIN_EMAIL || env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(env.PROVISION_ADMIN_PASSWORD || env.ADMIN_PASSWORD || '');
  const name = String(env.PROVISION_ADMIN_NAME || 'Home Companion Administrator').trim();
  const householdName = String(env.PROVISION_COMPANY_NAME || env.BOOTSTRAP_TENANT_NAME || 'Home Companion Household').trim();
  if (!email || password.length < 12) throw new Error('A valid admin email and password of at least 12 characters are required');

  const pool = createPool(env);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash(password, 12);
    const household = await client.query(
      `INSERT INTO companion_households(name) VALUES($1)
       RETURNING id`,
      [householdName],
    );
    const user = await client.query(
      `INSERT INTO companion_users(email,password_hash,status) VALUES($1,$2,'active')
       ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,status='active'
       RETURNING id`,
      [email, passwordHash],
    );
    const profile = await client.query(
      `INSERT INTO companion_profiles(tenant_id,display_name,age_band,status) VALUES($1,$2,'adult','active')
       RETURNING id`,
      [household.rows[0].id, name],
    );
    await client.query(
      `INSERT INTO companion_memberships(tenant_id,user_id,profile_id,role,status)
       VALUES($1,$2,$3,'guardian','active')
       ON CONFLICT(tenant_id,user_id,profile_id) DO UPDATE SET role='guardian',status='active'`,
      [household.rows[0].id, user.rows[0].id, profile.rows[0].id],
    );
    await client.query('COMMIT');
    console.log(`Provisioned governed admin identity for ${email}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) main().catch((error) => { console.error(error.message); process.exit(1); });

module.exports = { main };
