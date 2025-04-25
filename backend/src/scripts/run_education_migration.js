// run_education_migration.js - Handles education content database migrations
// This file is imported by server.ts to run migrations on startup

import pkg from 'pg';
const { Pool } = pkg;

// Function to run education content table migrations
export async function runEducationMigration() {
  console.log('Starting education content migration...');
  
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
      
      // 1. Check if education_articles table exists
      const articlesExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'education_articles'
        );
      `);
      
      // 2. Create education_articles table if it doesn't exist
      if (!articlesExists.rows[0].exists) {
        console.log('Creating education_articles table...');
        
        await client.query(`
          CREATE TABLE education_articles (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            content TEXT NOT NULL,
            summary TEXT,
            category TEXT,
            tags TEXT[],
            image_url TEXT,
            author TEXT,
            published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_published BOOLEAN DEFAULT FALSE,
            view_count INTEGER DEFAULT 0,
            reading_time_minutes INTEGER
          );
        `);
        
        console.log('education_articles table created successfully');
      } else {
        console.log('education_articles table already exists, skipping creation');
      }
      
      // 3. Check if education_categories table exists
      const categoriesExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'education_categories'
        );
      `);
      
      // 4. Create education_categories table if it doesn't exist
      if (!categoriesExists.rows[0].exists) {
        console.log('Creating education_categories table...');
        
        await client.query(`
          CREATE TABLE education_categories (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            icon TEXT,
            parent_id INTEGER REFERENCES education_categories(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        console.log('education_categories table created successfully');
      } else {
        console.log('education_categories table already exists, skipping creation');
      }
      
      // 5. Check if education_user_progress table exists
      const progressExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'education_user_progress'
        );
      `);
      
      // 6. Create education_user_progress table if it doesn't exist
      if (!progressExists.rows[0].exists) {
        console.log('Creating education_user_progress table...');
        
        await client.query(`
          CREATE TABLE education_user_progress (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            article_id INTEGER REFERENCES education_articles(id),
            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed BOOLEAN DEFAULT FALSE,
            progress_percent INTEGER DEFAULT 0,
            UNIQUE(user_id, article_id)
          );
        `);
        
        console.log('education_user_progress table created successfully');
      } else {
        console.log('education_user_progress table already exists, skipping creation');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Education migration completed successfully');
      
      return { success: true };
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error in education migration:', error);
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
export default { runEducationMigration };
