// 20250410_create_survey_tables.js - Creates survey-related database tables
// This file is imported by server.ts to run migrations on startup

import pkg from 'pg';
const { Pool } = pkg;

// Function to run survey tables migration
export async function runSurveyTablesMigration() {
  console.log('Starting survey tables migration...');
  
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
      
      // 1. Check if surveys table exists
      const surveysExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'surveys'
        );
      `);
      
      // 2. Create surveys table if it doesn't exist
      if (!surveysExists.rows[0].exists) {
        console.log('Creating surveys table...');
        
        await client.query(`
          CREATE TABLE surveys (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            published_at TIMESTAMP,
            closed_at TIMESTAMP,
            created_by UUID REFERENCES users(id),
            is_anonymous BOOLEAN DEFAULT FALSE,
            max_responses INTEGER,
            survey_type TEXT DEFAULT 'general',
            target_audience TEXT[]
          );
        `);
        
        console.log('surveys table created successfully');
      } else {
        console.log('surveys table already exists, skipping creation');
      }
      
      // 3. Check if survey_questions table exists
      const questionsExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'survey_questions'
        );
      `);
      
      // 4. Create survey_questions table if it doesn't exist
      if (!questionsExists.rows[0].exists) {
        console.log('Creating survey_questions table...');
        
        await client.query(`
          CREATE TABLE survey_questions (
            id SERIAL PRIMARY KEY,
            survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
            question_text TEXT NOT NULL,
            question_type TEXT NOT NULL,
            is_required BOOLEAN DEFAULT FALSE,
            options JSONB,
            order_index INTEGER NOT NULL,
            conditional_logic JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        console.log('survey_questions table created successfully');
      } else {
        console.log('survey_questions table already exists, skipping creation');
      }
      
      // 5. Check if survey_responses table exists
      const responsesExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'survey_responses'
        );
      `);
      
      // 6. Create survey_responses table if it doesn't exist
      if (!responsesExists.rows[0].exists) {
        console.log('Creating survey_responses table...');
        
        await client.query(`
          CREATE TABLE survey_responses (
            id SERIAL PRIMARY KEY,
            survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id),
            completed BOOLEAN DEFAULT FALSE,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            session_id TEXT
          );
        `);
        
        console.log('survey_responses table created successfully');
      } else {
        console.log('survey_responses table already exists, skipping creation');
      }
      
      // 7. Check if survey_answers table exists
      const answersExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'survey_answers'
        );
      `);
      
      // 8. Create survey_answers table if it doesn't exist
      if (!answersExists.rows[0].exists) {
        console.log('Creating survey_answers table...');
        
        await client.query(`
          CREATE TABLE survey_answers (
            id SERIAL PRIMARY KEY,
            response_id INTEGER REFERENCES survey_responses(id) ON DELETE CASCADE,
            question_id INTEGER REFERENCES survey_questions(id) ON DELETE CASCADE,
            answer_value TEXT,
            answer_json JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(response_id, question_id)
          );
        `);
        
        console.log('survey_answers table created successfully');
      } else {
        console.log('survey_answers table already exists, skipping creation');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Survey tables migration completed successfully');
      
      return { success: true, tablesCreated: !surveysExists.rows[0].exists };
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error in survey tables migration:', error);
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
export default { runSurveyTablesMigration };
