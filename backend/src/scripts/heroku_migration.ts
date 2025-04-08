// backend/src/scripts/heroku_migration.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
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
    
    // If the column already exists, check if it has data
    if (columnCheckResult.rows.length > 0) {
      // Check if the search_vector column has data
      const dataCheckResult = await client.query(`
        SELECT COUNT(*) FROM products WHERE search_vector IS NOT NULL LIMIT 1
      `);
      
      if (parseInt(dataCheckResult.rows[0].count) > 0) {
        appLogger.info('Search vector column exists and has data, skipping migration');
        await client.query('COMMIT');
        return;
      }
      
      appLogger.info('Search vector column exists but has no data, updating search vectors');
    } else {
      appLogger.info('Search vector column does not exist, creating it');
    }
    
    // Read and execute the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/20250227_01_add_search_index.sql');
    
    if (!fs.existsSync(migrationPath)) {
      appLogger.warn(`Migration file not found at ${migrationPath}`);
      await client.query('COMMIT');
      return;
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    try {
      appLogger.info('Executing search index migration');
      await client.query(sql);
      appLogger.info('Search index migration SQL executed successfully');
    } catch (error) {
      // If there's an error, try to execute each statement separately
      const sqlError = error as Error;
      appLogger.warn(`Error executing migration as a batch: ${sqlError.message}`);
      appLogger.info('Trying to execute migration statements individually');
      
      const statements = sql.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        try {
          await client.query(statement);
          appLogger.info(`Successfully executed: ${statement.substring(0, 50)}...`);
        } catch (error) {
          const stmtError = error as Error;
          appLogger.warn(`Error executing statement: ${statement.substring(0, 50)}...`);
          appLogger.warn(`Error message: ${stmtError.message}`);
          // Continue with the next statement
        }
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    appLogger.info('Search optimization migration completed');
    
    // Verify the index was created
    const indexResult = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'products' AND indexname = 'products_search_idx'
    `);
    
    if (indexResult.rows.length > 0) {
      appLogger.info('Search index verified: products_search_idx exists');
      
      // Update any null search vectors
      const updateResult = await client.query(`
        UPDATE products 
        SET search_vector = 
          setweight(to_tsvector('english', COALESCE(product_name, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(model, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
          setweight(to_tsvector('english', COALESCE(main_category, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(sub_category, '')), 'B')
        WHERE search_vector IS NULL
      `);
      
      appLogger.info(`Updated ${updateResult.rowCount} products with null search vectors`);
    } else {
      appLogger.warn('Search index verification failed: products_search_idx not found');
    }
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    appLogger.error('Error running search optimization migration', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  } finally {
    // Release client back to pool
    client.release();
  }
}
