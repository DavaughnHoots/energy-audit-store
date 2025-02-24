import { Pool, PoolConfig } from 'pg';
import { appLogger, createLogMetadata } from './logger';

// Parse DATABASE_URL for Heroku
const parseDbUrl = (url: string): PoolConfig => {
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
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : undefined,
    max: parseInt(process.env.DB_POOL_SIZE || '20'),
    idleTimeoutMillis: 30000
  };
};

// Configure database connection based on environment
export const dbConfig: PoolConfig = process.env.DATABASE_URL 
  ? parseDbUrl(process.env.DATABASE_URL)
  : {
      user: 'postgres',
      password: process.env.DB_PASSWORD || '',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: 'postgres',
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
