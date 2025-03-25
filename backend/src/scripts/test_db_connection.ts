import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432')
  });

  try {
    console.log('Environment variables:', {
      DB_USER: process.env.DB_USER,
      DB_HOST: process.env.DB_HOST,
      DB_NAME: process.env.DB_NAME,
      DB_PORT: process.env.DB_PORT,
      DB_PASSWORD: process.env.DB_PASSWORD ? '[REDACTED]' : 'not set'
    });

    console.log('Testing database connection with config:', {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432')
    });

    console.log('Attempting to connect to PostgreSQL...');
    const result = await pool.query('SELECT version()');
    console.log('Successfully connected to PostgreSQL.');
    console.log('PostgreSQL version:', result.rows[0].version);
  } catch (err) {
    const error = err as { message?: string; code?: string };
    console.error('Failed to connect to PostgreSQL');
    console.error('Error details:', {
      message: error.message || 'Unknown error',
      code: error.code || 'No error code'
    });
    console.error('Please ensure PostgreSQL is installed and running.');
    console.error('You can check PostgreSQL status with: pg_ctl status');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection().catch(console.error);
