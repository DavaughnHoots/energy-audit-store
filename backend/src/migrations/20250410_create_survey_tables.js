/**
 * Migration to create survey tables for storing pilot study feedback
 */

import { appLogger } from '../config/logger.js';
import pool from '../config/database.js';

/**
 * SQL to create the survey_responses table
 */
const createSurveyResponsesTable = `
CREATE TABLE IF NOT EXISTS survey_responses (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NULL, -- NULL for anonymous responses
  submission_date TIMESTAMP NOT NULL DEFAULT NOW(),
  user_agent VARCHAR(255) NULL, -- Browser info
  ip_address VARCHAR(45) NULL, -- For demographics
  completion_time_seconds INTEGER NULL -- How long it took to complete
);
`;

/**
 * SQL to create the survey_response_answers table
 */
const createSurveyResponseAnswersTable = `
CREATE TABLE IF NOT EXISTS survey_response_answers (
  id SERIAL PRIMARY KEY,
  response_id INTEGER NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id VARCHAR(50) NOT NULL, -- e.g., 'ui-intuitive', 'feature-improvements'
  question_section VARCHAR(50) NOT NULL, -- e.g., 'usability', 'features', 'overall'
  question_type VARCHAR(20) NOT NULL, -- 'likert', 'text', 'checkbox'
  
  -- Different types of answers (only one will be used per row, based on question_type)
  likert_value INTEGER NULL, -- 1-5 scale value
  text_value TEXT NULL, -- For text responses
  checkbox_values JSONB NULL, -- For storing multiple selected options
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Add index for quick lookups by response_id and question_id
  CONSTRAINT unique_response_question UNIQUE (response_id, question_id)
);
`;

/**
 * SQL to create indexes for efficient querying
 */
const createIndexes = `
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_date ON survey_responses(submission_date);
CREATE INDEX IF NOT EXISTS idx_survey_answers_question ON survey_response_answers(question_id, question_type);
`;

/**
 * Run the migration
 */
export async function runSurveyTablesMigration() {
  let client;
  
  try {
    client = await pool.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    // Create survey_responses table
    appLogger.info('Creating survey_responses table...');
    await client.query(createSurveyResponsesTable);
    
    // Create survey_response_answers table
    appLogger.info('Creating survey_response_answers table...');
    await client.query(createSurveyResponseAnswersTable);
    
    // Create indexes
    appLogger.info('Creating indexes for survey tables...');
    await client.query(createIndexes);
    
    // Commit transaction
    await client.query('COMMIT');
    
    appLogger.info('Survey tables migration completed successfully');
    
    return { success: true, message: 'Survey tables created successfully' };
  } catch (error) {
    // Rollback transaction on error
    if (client) {
      await client.query('ROLLBACK');
    }
    
    appLogger.error('Error during survey tables migration:', { error });
    
    return {
      success: false,
      message: 'Error creating survey tables',
      error: error.message
    };
  } finally {
    // Release client back to pool
    if (client) {
      client.release();
    }
  }
}

// Export for use in server.ts
export default runSurveyTablesMigration;
