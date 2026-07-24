'use strict';

const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { createPool } = require('../db');

async function main() {
  const pool = createPool(process.env);
  try {
    const directory = path.join(__dirname, '..', 'migrations');
    for (const name of fs.readdirSync(directory).filter((entry) => entry.endsWith('.sql')).sort()) {
      await pool.query(fs.readFileSync(path.join(directory, name), 'utf8'));
      console.log(`Reconciled ${name}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
