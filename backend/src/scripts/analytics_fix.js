// backend/src/scripts/analytics_fix.js

/**
 * This script creates necessary analytics tables in the database.
 * Run directly on Heroku with:
 * heroku run node backend/src/scripts/analytics_fix.js --app your-app-name
 */

import { pool } from '../config/database.js';

// Banner and message formatting
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';

// Log a banner
console.log(`${BOLD}${BLUE}
======================================================
    Energy Audit Analytics Fix Deployment Script
======================================================
${RESET}`);

// Function to create analytics tables
async function createAnalyticsTables() {
  console.log(`\n${YELLOW}Creating analytics tables if they don't exist...${RESET}`);
  
  try {
    // Create sessions table
    console.log('Creating analytics_sessions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_sessions (
        id UUID PRIMARY KEY,
        user_id UUID,
        first_activity TIMESTAMP DEFAULT NOW(),
        last_activity TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create events table
    console.log('Creating analytics_events table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES analytics_sessions(id),
        event_type VARCHAR(255) NOT NULL,
        area VARCHAR(255) NOT NULL,
        event_data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create analytics reports table
    console.log('Creating analytics_reports table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_reports (
        id UUID PRIMARY KEY,
        timeframe VARCHAR(50) NOT NULL,
        metrics JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create indexes
    console.log('Creating indexes for analytics tables...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_area ON analytics_events(area);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
    `);
    
    console.log(`${GREEN}Analytics tables and indexes successfully created!${RESET}`);
    return true;
  } catch (error) {
    console.error(`${RED}Error creating analytics tables:${RESET}`, error);
    return false;
  }
}

// Function to check if tables exist
async function verifyTablesExist() {
  console.log(`\n${YELLOW}Verifying analytics tables exist...${RESET}`);
  
  try {
    // Check sessions table
    const sessionsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics_sessions'
      );
    `);
    
    // Check events table
    const eventsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics_events'
      );
    `);
    
    const sessionsExist = sessionsResult.rows[0].exists;
    const eventsExist = eventsResult.rows[0].exists;
    
    if (sessionsExist && eventsExist) {
      console.log(`${GREEN}Analytics tables exist in the database.${RESET}`);
      return true;
    } else {
      console.log(`${YELLOW}Missing tables: ${!sessionsExist ? 'analytics_sessions ' : ''}${!eventsExist ? 'analytics_events' : ''}${RESET}`);
      return false;
    }
  } catch (error) {
    console.error(`${RED}Error verifying analytics tables:${RESET}`, error);
    return false;
  }
}

// Test database connection
async function testDatabaseConnection() {
  console.log(`\n${YELLOW}Testing database connection...${RESET}`);
  
  try {
    const client = await pool.connect();
    console.log(`${GREEN}Database connection successful!${RESET}`);
    client.release();
    return true;
  } catch (error) {
    console.error(`${RED}Database connection failed:${RESET}`, error);
    return false;
  }
}

// Insert test data
async function insertTestData() {
  console.log(`\n${YELLOW}Inserting test data to verify write permissions...${RESET}`);
  
  try {
    // Insert a test session
    const sessionId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    await pool.query(`
      INSERT INTO analytics_sessions (id, first_activity, last_activity)
      VALUES ($1, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [sessionId]);
    
    // Insert a test event
    await pool.query(`
      INSERT INTO analytics_events (session_id, event_type, area, event_data, created_at)
      VALUES ($1, 'test_event', 'test_area', $2, NOW())
    `, [sessionId, JSON.stringify({ test: true, source: 'deploy_script' })]);
    
    console.log(`${GREEN}Test data successfully inserted!${RESET}`);
    return true;
  } catch (error) {
    console.error(`${RED}Error inserting test data:${RESET}`, error);
    return false;
  }
}

// Delete test data
async function deleteTestData() {
  console.log(`\n${YELLOW}Cleaning up test data...${RESET}`);
  
  try {
    const sessionId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    
    // Delete test events
    await pool.query(`
      DELETE FROM analytics_events 
      WHERE session_id = $1 AND event_type = 'test_event' AND area = 'test_area'
    `, [sessionId]);
    
    // Delete test session
    await pool.query(`
      DELETE FROM analytics_sessions 
      WHERE id = $1
    `, [sessionId]);
    
    console.log(`${GREEN}Test data successfully cleaned up!${RESET}`);
    return true;
  } catch (error) {
    console.error(`${RED}Error cleaning up test data:${RESET}`, error);
    return false;
  }
}

// Main function
async function main() {
  let success = true;
  
  try {
    // Step 1: Test database connection
    const dbConnectionSuccess = await testDatabaseConnection();
    if (!dbConnectionSuccess) {
      console.error(`${RED}Database connection failed. Exiting.${RESET}`);
      process.exit(1);
    }
    
    // Step 2: Create tables if they don't exist
    const tablesCreated = await createAnalyticsTables();
    success = success && tablesCreated;
    
    // Step 3: Verify tables exist
    const tablesExist = await verifyTablesExist();
    success = success && tablesExist;
    
    // Step 4: Test inserting data
    if (success) {
      const insertSuccess = await insertTestData();
      success = success && insertSuccess;
      
      // Step 5: Clean up test data
      if (insertSuccess) {
        const deleteSuccess = await deleteTestData();
        success = success && deleteSuccess;
      }
    }
    
    // Print final status
    if (success) {
      console.log(`\n${BOLD}${GREEN}=============================================
✅ Analytics Fix Deployment Successful! ✅
=============================================
${RESET}`);
    } else {
      console.log(`\n${BOLD}${YELLOW}=============================================
⚠️ Analytics Fix Deployment Partially Successful ⚠️
Some steps failed - check the logs above.
=============================================
${RESET}`);
    }
  } catch (error) {
    console.error(`\n${BOLD}${RED}=============================================
❌ Analytics Fix Deployment Failed! ❌
=============================================
${RESET}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run the main function
main().catch(error => {
  console.error(`\n${BOLD}${RED}Unhandled error in deployment script:${RESET}`, error);
  process.exit(1);
});
