import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse DATABASE_URL for Heroku
const parseDbUrl = (url: string) => {
  const pattern = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const matches = url.match(pattern);
  
  if (!matches) {
    throw new Error('Invalid DATABASE_URL format');
  }

  const [, user, password, host, port, database] = matches;

  return {
    user,
    password,
    host,
    port: parseInt(port),
    database,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000
  };
};

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const dbConfig = parseDbUrl(process.env.DATABASE_URL);
  const pool = new Pool(dbConfig);
  
  try {
    console.log('Starting product preferences migration on Heroku...');
    
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
      console.log('Product preferences migration completed successfully on Heroku');
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
