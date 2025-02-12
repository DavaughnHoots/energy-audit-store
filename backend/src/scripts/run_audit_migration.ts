import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

// Create a dedicated pool for migration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432')
});

async function runMigration() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    // Read and execute migration
    console.log('Reading migration file...');
    const migrationPath = join(__dirname, '..', 'migrations', 'audit_completion_flow.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log('Migration file read successfully');

    // Split SQL commands and execute them one by one
    console.log('Running audit completion flow migration...');
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      try {
        console.log(`Executing command ${i + 1} of ${commands.length}...`);
        console.log('Command:', command);
        await pool.query(command);
        console.log(`Command ${i + 1} executed successfully`);
      } catch (err) {
        const error = err as { message?: string };
        if (error.message?.includes('already exists')) {
          console.log('Skipping existing object...');
          continue;
        }
        console.error(`Error executing command ${i + 1}:`, error.message || 'Unknown error');
        throw err;
      }
    }

    console.log('Successfully ran audit completion flow migration');
  } catch (err) {
    const error = err as { 
      message?: string;
      stack?: string;
      code?: string;
      detail?: string;
    };
    
    console.error('Error details:', {
      message: error.message || 'Unknown error',
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

runMigration().catch(console.error);
