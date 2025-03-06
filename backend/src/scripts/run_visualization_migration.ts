import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appLogger } from '../utils/logger.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
import { dbConfig } from '../config/database.js';

async function runMigration() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();

  try {
    appLogger.info('Starting visualization data table migration');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/add_visualization_data_table.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into statements
    const statements = migrationSql
      .split(';')
      .filter(statement => statement.trim() !== '')
      .map(statement => statement.trim() + ';');
    
    // Execute each statement
    for (const statement of statements) {
      appLogger.debug(`Executing SQL: ${statement.substring(0, 100)}...`);
      await client.query(statement);
    }
    
    // Record the migration in the migrations table
    await client.query(
      `INSERT INTO migrations (name, applied_at) 
       VALUES ($1, CURRENT_TIMESTAMP) 
       ON CONFLICT (name) DO NOTHING`,
      ['add_visualization_data_table']
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    appLogger.info('Visualization data table migration completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    appLogger.error('Error running visualization data table migration', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the migration if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration };
