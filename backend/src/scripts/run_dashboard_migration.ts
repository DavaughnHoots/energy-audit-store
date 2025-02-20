import { Pool } from 'pg';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { appLogger } from '../config/logger';
import { dbConfig } from '../config/database';

async function runMigration() {
  const pool = new Pool(dbConfig);

  try {
    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Read and execute migration SQL
      const migrationPath = join(__dirname, '..', 'migrations', 'dashboard_enhancements.sql');
      const migrationSQL = await readFile(migrationPath, 'utf8');

      // Split and execute each statement separately
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        await client.query(statement);
      }

      // Initial refresh of materialized view
      await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats');

      await client.query('COMMIT');
      appLogger.info('Dashboard enhancements migration completed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    appLogger.error('Error running dashboard enhancements migration:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigration;
