// heroku_migration.js - Handles database migrations for Heroku deployment
// This file is imported by server.ts to run migrations on startup

import pkg from 'pg';
const { Pool } = pkg;

// Function to run search-related migrations
export async function runSearchMigration() {
  console.log('Starting search migration...');
  
  // Create a database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // 1. Check if search_logs table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'search_logs'
        );
      `);
      
      // 2. Create search_logs table if it doesn't exist
      if (!tableExists.rows[0].exists) {
        console.log('Creating search_logs table...');
        
        await client.query(`
          CREATE TABLE search_logs (
            id SERIAL PRIMARY KEY,
            search_term TEXT NOT NULL,
            user_id UUID,
            search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            result_count INTEGER,
            filters JSONB,
            session_id TEXT,
            ip_address TEXT,
            user_agent TEXT
          );
        `);
        
        console.log('search_logs table created successfully');
      } else {
        console.log('search_logs table already exists, skipping creation');
      }
      
      // 3. Check if search_categories table exists
      const categoriesExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'search_categories'
        );
      `);
      
      // 4. Create search_categories table if it doesn't exist
      if (!categoriesExists.rows[0].exists) {
        console.log('Creating search_categories table...');
        
        await client.query(`
          CREATE TABLE search_categories (
            id SERIAL PRIMARY KEY,
            category_name TEXT UNIQUE NOT NULL,
            parent_category_id INTEGER REFERENCES search_categories(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT
          );
        `);
        
        console.log('search_categories table created successfully');
      } else {
        console.log('search_categories table already exists, skipping creation');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Search migration completed successfully');
      
      return { success: true };
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error in search migration:', error);
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  } finally {
    // Close pool
    await pool.end();
  }
}

// Default export for compatibility
export default { runSearchMigration };
