import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appLogger } from '../utils/logger.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    appLogger.info('Starting visualization data table migration');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Read and execute the migration SQL
    const migrationPath = path.join(__dirname, '../migrations/add_visualization_data_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    appLogger.info('Executing migration SQL');
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    appLogger.info('Migration completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    appLogger.error('Migration failed', { error });
    throw error;
  } finally {
    // Release client
    client.release();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Visualization data table migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
