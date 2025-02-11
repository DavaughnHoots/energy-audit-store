import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432')
});

async function runMigration() {
  const client = await pool.connect();
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/auth_enhancements.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Start transaction
    await client.query('BEGIN');

    // Execute migration
    await client.query(migrationSQL);

    // Commit transaction
    await client.query('COMMIT');

    console.log('Auth enhancement migration completed successfully');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration().catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
