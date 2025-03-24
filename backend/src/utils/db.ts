// backend/src/utils/db.ts
import { Pool } from 'pg';
import { dbConfig } from '../config/database.js';

// Create a connection pool using the configuration from database.ts
const pool = new Pool(dbConfig);

// Export a simple interface for query execution
export default {
  /**
   * Execute a SQL query with optional parameters
   * @param text SQL query text
   * @param params Query parameters
   * @returns Query result
   */
  async query(text: string, params?: any[]) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  /**
   * Get a client from the pool
   * Useful for transactions that require multiple queries in a single client
   */
  async getClient() {
    const client = await pool.connect();
    return client;
  },
  
  /**
   * Close all connections in the pool
   * Useful for graceful shutdown
   */
  async end() {
    await pool.end();
  }
};
