/**
 * Generate SQL commands to fix analytics tables on Heroku
 * 
 * Since scripts don't work on the Heroku deployment, this script generates the
 * SQL commands that can be manually executed with pg:psql to create the required tables.
 * 
 * Usage:
 * 1. Run this script:
 *    node scripts/heroku_direct_analytics_fix.js > analytics_tables.sql
 * 
 * 2. Connect to Heroku database:
 *    heroku pg:psql -a energy-audit-store < analytics_tables.sql
 */

// SQL for creating analytics_events table
const createEventsTable = `
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

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_area ON analytics_events(area);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
`;

// SQL for creating analytics_sessions table
const createSessionsTable = `
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

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start_time ON analytics_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_is_active ON analytics_sessions(is_active);
`;

// SQL for creating analytics_consent table
const createConsentTable = `
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

CREATE INDEX IF NOT EXISTS idx_analytics_consent_user_id ON analytics_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_consent_status ON analytics_consent(status);
`;

// SQL for creating pilot_tokens table
const createPilotTokensTable = `
CREATE TABLE IF NOT EXISTS pilot_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(50) NOT NULL UNIQUE,
  participant_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  used_at TIMESTAMP,
  used_by VARCHAR(50)
);

INSERT INTO pilot_tokens (token, participant_type)
VALUES 
  ('ENERGY-PILOT-HC-001', 'homeowner-energy-conscious'),
  ('ENERGY-PILOT-HL-001', 'homeowner-limited-knowledge'),
  ('ENERGY-PILOT-HT-001', 'homeowner-technical'),
  ('ENERGY-PILOT-HN-001', 'homeowner-non-technical')
ON CONFLICT (token) DO NOTHING;
`;

// SQL for verification
const verifyTables = `
-- Verify tables exist
SELECT 
  table_name,
  'Table exists in database' as status
FROM 
  information_schema.tables 
WHERE 
  table_schema = 'public' 
  AND table_name IN ('analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens');

-- Show row counts for each table
SELECT 'analytics_events' as table_name, COUNT(*) as row_count FROM analytics_events
UNION ALL
SELECT 'analytics_sessions' as table_name, COUNT(*) as row_count FROM analytics_sessions
UNION ALL
SELECT 'analytics_consent' as table_name, COUNT(*) as row_count FROM analytics_consent
UNION ALL
SELECT 'pilot_tokens' as table_name, COUNT(*) as row_count FROM pilot_tokens;
`;

// Output the combined SQL
console.log(`-- Analytics Tables Fix for Heroku`);
console.log(`-- Generated on ${new Date().toISOString()}`);
console.log(`-- Run this file with: heroku pg:psql -a energy-audit-store < analytics_tables.sql`);
console.log(`\n-- Create analytics_events table`);
console.log(createEventsTable);
console.log(`\n-- Create analytics_sessions table`);
console.log(createSessionsTable);
console.log(`\n-- Create analytics_consent table`);
console.log(createConsentTable);
console.log(`\n-- Create pilot_tokens table`);
console.log(createPilotTokensTable);
console.log(`\n-- Verify tables were created successfully`);
console.log(verifyTables);
