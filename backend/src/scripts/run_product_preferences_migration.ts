import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbConfig } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('Starting product preferences migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/20250306_01_add_product_preferences.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Execute the migration
      await client.query(migrationSQL);
      
      // Create a record of the migration
      await client.query(
        `INSERT INTO migrations (name, applied_at) 
         VALUES ($1, CURRENT_TIMESTAMP) 
         ON CONFLICT (name) DO NOTHING`,
        ['20250306_01_add_product_preferences']
      );
      
      await client.query('COMMIT');
      console.log('Product preferences migration completed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error during migration:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
