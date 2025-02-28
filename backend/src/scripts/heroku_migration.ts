// backend/src/scripts/heroku_migration.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { appLogger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run the search optimization migration on application startup
 * This is used in production environments like Heroku
 */
export async function runSearchMigration() {
  const client = await pool.connect();
  
  try {
    appLogger.info('Starting search optimization migration');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if the search_vector column already exists
    const columnCheckResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'search_vector'
    `);
    
    // If the column already exists, skip the migration
    if (columnCheckResult.rows.length > 0) {
      appLogger.info('Search vector column already exists, skipping migration');
      await client.query('COMMIT');
      return;
    }
    
    // Read and execute the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/20250227_01_add_search_index.sql');
    
    if (!fs.existsSync(migrationPath)) {
      appLogger.warn(`Migration file not found at ${migrationPath}`);
      await client.query('COMMIT');
      return;
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    appLogger.info('Executing search index migration');
    await client.query(sql);
    
    // Commit transaction
    await client.query('COMMIT');
    
    appLogger.info('Search optimization migration completed successfully');
    
    // Verify the index was created
    const indexResult = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'products' AND indexname = 'products_search_idx'
    `);
    
    if (indexResult.rows.length > 0) {
      appLogger.info('Search index verified: products_search_idx exists');
    } else {
      appLogger.warn('Search index verification failed: products_search_idx not found');
    }
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    appLogger.error('Error running search optimization migration', { error });
  } finally {
    // Release client back to pool
    client.release();
  }
}
