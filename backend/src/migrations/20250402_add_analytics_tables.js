// backend/src/migrations/20250402_add_analytics_tables.js

import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';
// Using console.log instead of appLogger since it might not be available
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[ERROR] ${msg}`, data || '')
};

/**
 * Migration to create analytics tables for the pilot study
 */
export async function runAnalyticsMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Start transaction
    await pool.query('BEGIN');

    // Create analytics_events table
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
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_area ON analytics_events(area);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
    `);

    // Create analytics_sessions table
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
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start_time ON analytics_sessions(start_time);
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_is_active ON analytics_sessions(is_active);
    `);

    // Create analytics_consent table
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
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_consent_user_id ON analytics_consent(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_consent_status ON analytics_consent(status);
    `);

    // Create analytics_feature_metrics table for aggregated metrics
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
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_feature_metrics_feature_id ON analytics_feature_metrics(feature_id);
    `);

    // Commit transaction
    await pool.query('COMMIT');

    logger.info('Successfully created analytics tables');
    return { success: true };
  } catch (error) {
    // Rollback transaction on error
    await pool.query('ROLLBACK');
    logger.error('Error creating analytics tables', { error: error.message });
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// If this file is run directly, execute the migration
if (process.argv[1].endsWith('20250402_add_analytics_tables.js')) {
  runAnalyticsMigration()
    .then(result => {
      console.log('Migration completed with result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration failed with error:', error);
      process.exit(1);
    });
}
