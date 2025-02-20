import { Pool, PoolConfig } from 'pg';
import { appLogger, createLogMetadata } from './logger';

// Ensure we have required environment variables
if (!process.env.DB_USER) {
  appLogger.warn('DB_USER not set in environment, using default postgres user');
}

export const dbConfig: PoolConfig = {
  user: 'postgres', // Explicitly set postgres user
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres', // Use postgres database explicitly
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : undefined,
  max: parseInt(process.env.DB_POOL_SIZE || '20'),
  idleTimeoutMillis: 30000
};

// Log database configuration (without sensitive data)
appLogger.info('Database configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  max: dbConfig.max,
  ssl: !!dbConfig.ssl
});

// Create a pool instance to be used across the application
const pool = new Pool(dbConfig);

// Log pool errors
pool.on('error', (err) => {
  appLogger.error('Unexpected error on idle client', createLogMetadata(undefined, { error: err }));
  process.exit(-1);
});

// Test database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    appLogger.error('Error connecting to the database', createLogMetadata(undefined, { error: err }));
    process.exit(-1);
  } else {
    appLogger.info('Successfully connected to the database');
  }
});

export { pool };
export default pool;
