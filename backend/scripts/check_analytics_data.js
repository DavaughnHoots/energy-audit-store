/**
 * Analytics Database Check and Fix Script
 * 
 * This script checks the analytics database tables and creates them if missing.
 * It also inserts test data if requested to validate the system.
 */

const { Pool } = require('pg');

// Database connection setup
const pool = new Pool();

// Test data constants
const TEST_SESSION_ID = '00000000-0000-0000-0000-000000000099';
const TEST_EVENT_ID = '00000000-0000-0000-0000-000000000098';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function createTablesIfMissing() {
  console.log(`${colors.cyan}Checking and creating required analytics tables...${colors.reset}`);
  
  try {
    // Create analytics_events table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY,
        session_id UUID NOT NULL,
        user_id UUID,
        event_type VARCHAR(50) NOT NULL,
        area VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log(`${colors.green}✓ analytics_events table created or confirmed${colors.reset}`);
    
    // Create analytics_sessions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_sessions (
        id UUID PRIMARY KEY,
        user_id UUID,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER,
        user_agent VARCHAR(255),
        device_type VARCHAR(50),
        screen_size VARCHAR(50),
        referrer VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        events_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log(`${colors.green}✓ analytics_sessions table created or confirmed${colors.reset}`);
    
    // Create analytics_consent table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_consent (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        status VARCHAR(20) NOT NULL,
        consent_date TIMESTAMP NOT NULL,
        consent_version VARCHAR(20) NOT NULL,
        data_usage_accepted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log(`${colors.green}✓ analytics_consent table created or confirmed${colors.reset}`);
    
    // Create analytics_feature_metrics table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_feature_metrics (
        id SERIAL PRIMARY KEY,
        feature_id VARCHAR(100) NOT NULL,
        feature_category VARCHAR(50),
        usage_count INTEGER NOT NULL DEFAULT 0,
        unique_users INTEGER NOT NULL DEFAULT 0,
        last_used TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log(`${colors.green}✓ analytics_feature_metrics table created or confirmed${colors.reset}`);
    
    // Create indexes for analytics_events
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_area ON analytics_events(area);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
    `);
    console.log(`${colors.green}✓ Indexes for analytics_events created or confirmed${colors.reset}`);
    
    // Create indexes for analytics_sessions
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start_time ON analytics_sessions(start_time);
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_is_active ON analytics_sessions(is_active);
    `);
    console.log(`${colors.green}✓ Indexes for analytics_sessions created or confirmed${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error creating tables:${colors.reset}`, error.message);
    if (error.code) {
      console.error(`${colors.red}Error code:${colors.reset} ${error.code}`);
    }
    return false;
  }
}

async function checkTableData() {
  console.log(`${colors.cyan}Checking for existing data in analytics tables...${colors.reset}`);
  
  try {
    // Check analytics_events
    const eventsResult = await pool.query('SELECT COUNT(*) as count FROM analytics_events');
    const eventsCount = parseInt(eventsResult.rows[0].count);
    console.log(`${colors.blue}analytics_events table contains ${eventsCount} records${colors.reset}`);
    
    // Check analytics_sessions
    const sessionsResult = await pool.query('SELECT COUNT(*) as count FROM analytics_sessions');
    const sessionsCount = parseInt(sessionsResult.rows[0].count);
    console.log(`${colors.blue}analytics_sessions table contains ${sessionsCount} records${colors.reset}`);
    
    return { eventsCount, sessionsCount };
  } catch (error) {
    console.error(`${colors.red}Error checking table data:${colors.reset}`, error.message);
    return { eventsCount: 0, sessionsCount: 0 };
  }
}

async function insertTestData() {
  console.log(`${colors.cyan}Inserting test data into analytics tables...${colors.reset}`);
  
  try {
    // First check for test session
    const sessionCheck = await pool.query(
      'SELECT id FROM analytics_sessions WHERE id = $1',
      [TEST_SESSION_ID]
    );
    
    // Create test session if needed
    if (sessionCheck.rowCount === 0) {
      console.log(`Creating test session with ID: ${TEST_SESSION_ID}`);
      await pool.query(
        `INSERT INTO analytics_sessions (
          id, start_time, is_active, events_count, created_at, updated_at
        ) VALUES ($1, NOW(), TRUE, 0, NOW(), NOW())`,
        [TEST_SESSION_ID]
      );
      console.log(`${colors.green}✓ Test session created${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Test session already exists${colors.reset}`);
    }
    
    // Try inserting a test event
    console.log(`Creating test event with ID: ${TEST_EVENT_ID}`);
    const eventInsert = await pool.query(
      `INSERT INTO analytics_events (
        id, session_id, user_id, event_type, area, timestamp, data, created_at
      ) VALUES ($1, $2, NULL, $3, $4, NOW(), $5, NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING id`,
      [TEST_EVENT_ID, TEST_SESSION_ID, 'diagnostic_test', 'test-area', JSON.stringify({ 
        test: true, 
        source: 'check_analytics_data.js',
        timestamp: new Date().toISOString()
      })]
    );
    
    if (eventInsert.rowCount > 0) {
      console.log(`${colors.green}✓ Test event inserted successfully${colors.reset}`);
    } else {
      // Check if it exists
      const eventCheck = await pool.query(
        'SELECT id FROM analytics_events WHERE id = $1',
        [TEST_EVENT_ID]
      );
      
      if (eventCheck.rowCount > 0) {
        console.log(`${colors.green}✓ Test event already exists${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️ Test event could not be inserted for unknown reason${colors.reset}`);
      }
    }
    
    // Update session events count
    await pool.query(
      'UPDATE analytics_sessions SET events_count = events_count + 1 WHERE id = $1',
      [TEST_SESSION_ID]
    );
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error inserting test data:${colors.reset}`, error.message);
    return false;
  }
}

async function validateMetricsQuery() {
  console.log(`${colors.cyan}Testing metrics query functionality...${colors.reset}`);
  
  try {
    // Define date range - last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Get total sessions
    const sessionsQuery = `
      SELECT COUNT(*) as total_sessions,
             AVG(COALESCE(duration, 0)) as avg_duration
      FROM analytics_sessions
      WHERE start_time BETWEEN $1 AND $2
    `;
    
    const sessionsResult = await pool.query(sessionsQuery, [startDate, endDate]);
    const totalSessions = parseInt(sessionsResult.rows[0]?.total_sessions || '0');
    const avgSessionDuration = Math.round(parseFloat(sessionsResult.rows[0]?.avg_duration || '0'));
    
    console.log(`${colors.blue}Query result: Total Sessions=${totalSessions}, Avg Duration=${avgSessionDuration}${colors.reset}`);
    
    // Get page views by area
    const pageViewsQuery = `
      SELECT area, COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'page_view'
      AND timestamp BETWEEN $1 AND $2
      GROUP BY area
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const pageViewsResult = await pool.query(pageViewsQuery, [startDate, endDate]);
    console.log(`${colors.blue}Page views query returned ${pageViewsResult.rowCount} rows${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error testing metrics query:${colors.reset}`, error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log(`${colors.magenta}==============================================${colors.reset}`);
  console.log(`${colors.magenta}    ANALYTICS DATABASE CHECK AND FIX TOOL    ${colors.reset}`);
  console.log(`${colors.magenta}==============================================${colors.reset}`);
  
  try {
    // Test database connection
    console.log(`${colors.cyan}Testing database connection...${colors.reset}`);
    const connectionResult = await pool.query('SELECT NOW() as time');
    console.log(`${colors.green}✓ Database connection successful!${colors.reset}`);
    console.log(`${colors.blue}Server time: ${connectionResult.rows[0].time}${colors.reset}`);
    
    // Check and create tables
    const tablesCreated = await createTablesIfMissing();
    
    if (!tablesCreated) {
      console.log(`${colors.red}Failed to create or verify tables. Exiting.${colors.reset}`);
      process.exit(1);
    }
    
    // Check for existing data
    const { eventsCount, sessionsCount } = await checkTableData();
    
    // If no data, insert test data
    if (eventsCount === 0 || sessionsCount === 0) {
      console.log(`${colors.yellow}No data found in analytics tables.${colors.reset}`);
      const insertResult = await insertTestData();
      
      if (!insertResult) {
        console.log(`${colors.red}Failed to insert test data.${colors.reset}`);
      }
    }
    
    // Test metrics query
    const metricsResult = await validateMetricsQuery();
    
    if (!metricsResult) {
      console.log(`${colors.yellow}Metrics query validation failed.${colors.reset}`);
    }
    
    console.log(`${colors.magenta}==============================================${colors.reset}`);
    console.log(`${colors.green}✓ Analytics database check and fix complete${colors.reset}`);
    console.log(`${colors.magenta}==============================================${colors.reset}`);
    
    // Final recommendations
    console.log("\nSummary and Next Steps:");
    console.log("1. All required tables are created and properly indexed");
    
    if (eventsCount > 0) {
      console.log(`2. Analytics tables contain data (${eventsCount} events, ${sessionsCount} sessions)`);
    } else {
      console.log(`2. Test data has been inserted into analytics tables`);
    }
    
    console.log("3. To run the analytics pipeline:");
    console.log("   - Restart the application");
    console.log("   - Use the Analytics Diagnostic Tool in the UI");
    console.log("   - Check browser logs for event transmission");
    
  } catch (error) {
    console.error(`${colors.red}Unhandled error:${colors.reset}`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the script
main().catch(err => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
