import pkg from 'pg';
const { Pool } = pkg;
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

async function verifyDatabaseStructure() {
  const client = await pool.connect();
  try {
    // Check users table columns
    const usersColumnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('failed_login_attempts', 'last_failed_login', 'last_login');
    `;
    
    console.log('\nChecking users table columns...');
    const usersColumnsResult = await client.query(usersColumnsQuery);
    console.log('Found columns in users table:', usersColumnsResult.rows);

    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('refresh_tokens', 'token_blacklist');
    `;
    
    console.log('\nChecking for required tables...');
    const tablesResult = await client.query(tablesQuery);
    console.log('Found tables:', tablesResult.rows);

    // Check indexes
    const indexesQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename IN ('refresh_tokens', 'token_blacklist')
      AND schemaname = 'public';
    `;
    
    console.log('\nChecking indexes...');
    const indexesResult = await client.query(indexesQuery);
    console.log('Found indexes:', indexesResult.rows);

    // Summary
    console.log('\nVerification Summary:');
    console.log('---------------------');
    console.log('Users Table Columns:', usersColumnsResult.rows.length === 3 ? '✅ All present' : '❌ Missing some columns');
    console.log('Required Tables:', tablesResult.rows.length === 2 ? '✅ All present' : '❌ Missing some tables');
    console.log('Required Indexes:', indexesResult.rows.length >= 4 ? '✅ All present' : '❌ Missing some indexes');

  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run verification
verifyDatabaseStructure().catch((error) => {
  console.error('Verification script failed:', error);
  process.exit(1);
});
