const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'energy_audit_store'
};

console.log('Using database config:', {
  ...dbConfig,
  password: dbConfig.password ? '[REDACTED]' : '[EMPTY]'
});

async function runPermissionsFix() {
  const pool = new Pool(dbConfig);

  try {
    // Connect and run the migration
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      console.log('Running permissions fix migration...');
      
      // Grant all privileges to postgres user
      await client.query(`
        DO $$ 
        BEGIN
          -- Grant all privileges on database
          EXECUTE format('GRANT ALL PRIVILEGES ON DATABASE %I TO postgres', current_database());
          
          -- Grant all privileges on all tables
          EXECUTE format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres');
          
          -- Grant all privileges on all sequences
          EXECUTE format('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres');
          
          -- Set ownership of all tables to postgres
          FOR table_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
          LOOP
            EXECUTE format('ALTER TABLE %I OWNER TO postgres', table_name);
          END LOOP;
          
          -- Set ownership of all sequences to postgres
          FOR seq_name IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public')
          LOOP
            EXECUTE format('ALTER SEQUENCE %I OWNER TO postgres', seq_name);
          END LOOP;
        END $$;
      `);
      
      await client.query('COMMIT');
      console.log('Permissions fix migration completed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error during migration:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error running permissions fix migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
runPermissionsFix().catch((error) => {
  console.error('Failed to run permissions fix:', error);
  process.exit(1);
});
