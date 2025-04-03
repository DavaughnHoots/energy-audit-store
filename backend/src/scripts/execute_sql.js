#!/usr/bin/env node

// Script to execute SQL commands directly on the Heroku Postgres database
// Usage: heroku run "cd backend && node build/scripts/execute_sql.js"

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlPath = path.join(__dirname, '../../analytics_tables.sql');
const sql = `
-- SQL script to create analytics tables

-- Create admin_config table
CREATE TABLE IF NOT EXISTS admin_config (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add admin password if it doesn't exist
INSERT INTO admin_config (key, value)
VALUES ('admin_password', 'PilotStudy2025!')
ON CONFLICT (key) DO NOTHING;

-- Create analytics_events table
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

-- Create indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_area ON analytics_events(area);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

-- Create analytics_sessions table
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

-- Create indexes for analytics_sessions
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start_time ON analytics_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_is_active ON analytics_sessions(is_active);

-- Create analytics_consent table
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

-- Create indexes for analytics_consent
CREATE INDEX IF NOT EXISTS idx_analytics_consent_user_id ON analytics_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_consent_status ON analytics_consent(status);

-- Create analytics_feature_metrics table
CREATE TABLE IF NOT EXISTS analytics_feature_metrics (
  id SERIAL PRIMARY KEY,
  feature_id VARCHAR(100) NOT NULL,
  feature_category VARCHAR(50),
  usage_count INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  last_used TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for analytics_feature_metrics
CREATE INDEX IF NOT EXISTS idx_analytics_feature_metrics_feature_id ON analytics_feature_metrics(feature_id);
`;

async function executeSQL() {
  // Use DATABASE_URL environment variable from Heroku
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected to database. Executing SQL commands...');
    
    // Execute the full SQL script
    await client.query(sql);
    console.log('SQL commands executed successfully');

    // Verify tables were created
    const result = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'analytics%'");
    console.log('\nVerifying tables:');
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`- ${row.table_name} has been created`);
      });
    } else {
      console.log('No analytics tables found. Something went wrong!');
    }

    client.release();
  } catch (err) {
    console.error('Error executing SQL:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executeSQL().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(err => {
  console.error('Failed to execute SQL:', err);
  process.exit(1);
});
