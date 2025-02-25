import pkg from 'pg';
import { appLogger, createLogMetadata } from './logger.js';

const { Pool } = pkg;

// Parse DATABASE_URL for Heroku
const parseDbUrl = (url: string): pkg.PoolConfig => {
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
export const dbConfig: pkg.PoolConfig = process.env.DATABASE_URL 
  ? parseDbUrl(process.env.DATABASE_URL)
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      max: parseInt(process.env.DB_POOL_SIZE || '20'),
      idleTimeoutMillis: 30000,
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : undefined
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

// Create a mock pool for development/testing when DB is not available
class MockPool {
  async query(text: string, params?: any[]) {
    appLogger.warn(`Mock DB query: ${text}`, { params });
    
    // Return mock data based on the query
    if (text.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date() }] };
    }
    
    return { rows: [] };
  }
  
  on(event: string, callback: Function) {
    // Do nothing
  }
  
  end() {
    // Do nothing
  }
}

let pool: any;

try {
  // Create a pool instance to be used across the application
  pool = new Pool(dbConfig);

  // Log pool errors
  pool.on('error', (err: Error) => {
    appLogger.error('Unexpected error on idle client', createLogMetadata(undefined, { error: err }));
    // Don't exit the process, just log the error
  });

  // Test database connection
  pool.query('SELECT NOW()', (err: Error | null) => {
    if (err) {
      appLogger.error('Error connecting to the database, using mock implementation', createLogMetadata(undefined, { error: err }));
      pool = new MockPool();
    } else {
      appLogger.info('Successfully connected to the database');
    }
  });
} catch (error) {
  appLogger.error('Failed to initialize database pool, using mock implementation', createLogMetadata(undefined, { error }));
  pool = new MockPool();
}

export { pool };
export default pool;
