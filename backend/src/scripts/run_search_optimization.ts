// backend/src/scripts/run_search_optimization.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { appLogger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    appLogger.info('Starting search optimization migration');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Read and execute the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/20250227_01_add_search_index.sql');
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
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Search optimization migration completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
