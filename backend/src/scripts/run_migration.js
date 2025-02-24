import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration(migrationFile) {
  try {
    const migrationPath = migrationFile || join(__dirname, '../migrations/add_property_details.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];
runMigration(migrationFile);
