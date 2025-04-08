// backend/src/scripts/run_education_migration.js
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appLogger, createLogMetadata } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs the education user engagement migration on the database
 * This creates the necessary tables for educational resources, collections, 
 * bookmarks, progress tracking, and ratings
 */
export async function runEducationMigration() {
  let client;
  
  try {
    // Get database connection from environment variables
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    
    // Create connection pool
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    client = await pool.connect();
    appLogger.info('Connected to database for education migration');
    
    // Read migration SQL
    const migrationPath = path.join(__dirname, '../migrations/20250324_01_education_user_engagement.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Execute migration
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    appLogger.info('Education tables migration completed successfully');
    return { success: true, message: 'Education tables created successfully' };
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    appLogger.error('Error running education migration:', { 
      error: error.message,
      stack: error.stack 
    });
    
    return { 
      success: false, 
      error: error.message
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Run migration directly if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Import dotenv to load environment variables from .env file when running directly
  import('dotenv/config').then(() => {
    runEducationMigration()
      .then(result => {
        console.log('Migration result:', result);
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('Migration error:', error);
        process.exit(1);
      });
  });
}
