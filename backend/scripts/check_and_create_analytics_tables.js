/**
 * Script to check and create analytics tables
 * 
 * This script will connect to the database, check if the analytics tables exist,
 * and create them if they don't. This addresses the 500 error when trying to
 * save analytics events.
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

// Get database connection from environment variables or use default
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/energy_audit_store',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Check if the analytics tables exist
 */
async function checkTablesExist() {
  const client = await pool.connect();
  try {
    console.log('Connected to database, checking if analytics tables exist...');
    
    // Check if analytics_events table exists
    const eventsTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'analytics_events'
      );
    `);
    
    // Check if analytics_sessions table exists
    const sessionsTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'analytics_sessions'
      );
    `);
    
    // Check if analytics_consent table exists
    const consentTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'analytics_consent'
      );
    `);
    
    return {
      eventsTableExists: eventsTableExists.rows[0].exists,
      sessionsTableExists: sessionsTableExists.rows[0].exists,
      consentTableExists: consentTableExists.rows[0].exists
    };
  } catch (error) {
    console.error('Error checking if tables exist:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create the analytics tables if they don't exist
 */
async function createAnalyticsTables() {
  const client = await pool.connect();
  try {
    console.log('Creating analytics tables...');
    
    // Create analytics_events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY,
        session_id UUID NOT NULL,
        user_id UUID,
        event_type VARCHAR(50) NOT NULL,
        area VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create indexes for analytics_events
    console.log('Creating indexes for analytics_events...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_events_area ON analytics_events(area);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);`);
    
    // Create analytics_sessions table
    console.log('Creating analytics_sessions table...');
    await client.query(`
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
      );
    `);
    
    // Create indexes for analytics_sessions
    console.log('Creating indexes for analytics_sessions...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start_time ON analytics_sessions(start_time);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_sessions_is_active ON analytics_sessions(is_active);`);
    
    // Create analytics_consent table
    console.log('Creating analytics_consent table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_consent (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        status VARCHAR(20) NOT NULL,
        consent_date TIMESTAMP NOT NULL,
        consent_version VARCHAR(20) NOT NULL,
        data_usage_accepted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create indexes for analytics_consent
    console.log('Creating indexes for analytics_consent...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_consent_user_id ON analytics_consent(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_analytics_consent_status ON analytics_consent(status);`);
    
    // Create pilot_tokens table
    console.log('Creating pilot_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS pilot_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(50) NOT NULL UNIQUE,
        participant_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        used_at TIMESTAMP,
        used_by VARCHAR(50)
      );
    `);
    
    // Insert default pilot tokens if they don't exist
    console.log('Inserting default pilot tokens...');
    await client.query(`
      INSERT INTO pilot_tokens (token, participant_type)
      VALUES 
        ('ENERGY-PILOT-HC-001', 'homeowner-energy-conscious'),
        ('ENERGY-PILOT-HL-001', 'homeowner-limited-knowledge'),
        ('ENERGY-PILOT-HT-001', 'homeowner-technical'),
        ('ENERGY-PILOT-HN-001', 'homeowner-non-technical')
      ON CONFLICT (token) DO NOTHING;
    `);
    
    console.log('All tables created successfully.');
    return true;
  } catch (error) {
    console.error('Error creating analytics tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Drop existing tables (for development purposes only)
 */
async function dropTables() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to drop tables in production environment');
    return false;
  }
  
  const client = await pool.connect();
  try {
    console.log('Dropping existing analytics tables...');
    
    // Drop tables in reverse order to avoid foreign key constraints
    await client.query('DROP TABLE IF EXISTS analytics_consent;');
    await client.query('DROP TABLE IF EXISTS analytics_events;');
    await client.query('DROP TABLE IF EXISTS analytics_sessions;');
    await client.query('DROP TABLE IF EXISTS pilot_tokens;');
    
    console.log('Tables dropped successfully.');
    return true;
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    console.log('Starting analytics tables check...');
    
    // Check if --drop flag is provided to drop existing tables
    const shouldDrop = process.argv.includes('--drop');
    if (shouldDrop) {
      await dropTables();
    }
    
    // Check if tables exist
    const { eventsTableExists, sessionsTableExists, consentTableExists } = await checkTablesExist();
    
    console.log('Tables status:');
    console.log(`- analytics_events: ${eventsTableExists ? 'Exists' : 'Missing'}`);
    console.log(`- analytics_sessions: ${sessionsTableExists ? 'Exists' : 'Missing'}`);
    console.log(`- analytics_consent: ${consentTableExists ? 'Exists' : 'Missing'}`);
    
    // If any tables are missing, create all of them to ensure consistency
    if (!eventsTableExists || !sessionsTableExists || !consentTableExists) {
      console.log('Some analytics tables are missing. Creating all tables...');
      await createAnalyticsTables();
      console.log('Tables created successfully. Analytics should now work properly.');
    } else {
      console.log('All analytics tables exist. No action required.');
    }
    
    // Verify tables again after creation
    const tablesAfter = await checkTablesExist();
    if (tablesAfter.eventsTableExists && tablesAfter.sessionsTableExists && tablesAfter.consentTableExists) {
      console.log('SUCCESS: All required tables are now available in the database.');
    } else {
      console.error('ERROR: Table creation failed. Some tables are still missing.');
    }
  } catch (error) {
    console.error('Error in main execution:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

// Run the script
main();
