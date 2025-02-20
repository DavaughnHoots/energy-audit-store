const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { appLogger } = require('../config/logger');
const { dbConfig } = require('../config/database');

async function runPermissionsFix() {
  const pool = new Pool(dbConfig);

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'migrations', 'fix_permissions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Connect and run the migration
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      appLogger.info('Running permissions fix migration...');
      await client.query(sql);
      
      await client.query('COMMIT');
      appLogger.info('Permissions fix migration completed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    appLogger.error('Error running permissions fix migration:', {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
runPermissionsFix().catch((error) => {
  appLogger.error('Failed to run permissions fix:', {}, error);
  process.exit(1);
});
