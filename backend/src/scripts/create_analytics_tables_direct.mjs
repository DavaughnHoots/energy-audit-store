/**
 * Direct SQL script to create analytics tables on Heroku
 * 
 * This script uses the pg module to directly execute SQL queries without ORM dependencies.
 */

import pg from 'pg';
const { Pool } = pg;

async function createTables() {
  console.log('Starting analytics tables creation...');
  
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');

    try {
      // Check if tables exist
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens')
      `);
      
      const existingTables = tableCheck.rows.map(row => row.table_name);
      console.log('Existing analytics tables:', existingTables);

      // Create UUID extension if it doesn't exist
      await client.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `);
      console.log('Ensured UUID extension exists');

      // Create sessions table first (for foreign key constraints)
      if (!existingTables.includes('analytics_sessions')) {
        console.log('Creating analytics_sessions table...');
        await client.query(`
          CREATE TABLE analytics_sessions (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255),
            start_time TIMESTAMP DEFAULT NOW(),
            end_time TIMESTAMP,
            duration INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            events_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('Created analytics_sessions table');
        
        // Create indexes for performance
        await client.query(`CREATE INDEX idx_sessions_user_id ON analytics_sessions(user_id);`);
        await client.query(`CREATE INDEX idx_sessions_start_time ON analytics_sessions(start_time);`);
        await client.query(`CREATE INDEX idx_sessions_is_active ON analytics_sessions(is_active);`);
        console.log('Created indexes for analytics_sessions table');
      }

      // Create events table
      if (!existingTables.includes('analytics_events')) {
        console.log('Creating analytics_events table...');
        await client.query(`
          CREATE TABLE analytics_events (
            id UUID PRIMARY KEY,
            session_id VARCHAR(255) NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
            user_id VARCHAR(255),
            event_type VARCHAR(255) NOT NULL,
            area VARCHAR(255) NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            data JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('Created analytics_events table');
        
        // Create indexes for performance
        await client.query(`CREATE INDEX idx_events_session_id ON analytics_events(session_id);`);
        await client.query(`CREATE INDEX idx_events_user_id ON analytics_events(user_id);`);
        await client.query(`CREATE INDEX idx_events_event_type ON analytics_events(event_type);`);
        await client.query(`CREATE INDEX idx_events_area ON analytics_events(area);`);
        await client.query(`CREATE INDEX idx_events_timestamp ON analytics_events(timestamp);`);
        console.log('Created indexes for analytics_events table');
      }

      // Create consent type if it doesn't exist
      if (!existingTables.includes('analytics_consent')) {
        console.log('Creating consent status enum type if needed...');
        try {
          await client.query(`
            CREATE TYPE consent_status AS ENUM ('granted', 'denied', 'withdrawn');
          `);
          console.log('Created consent_status enum type');
        } catch (error) {
          // If enum already exists, continue
          console.log('Consent status enum type might already exist, continuing...');
        }

        // Create consent table
        console.log('Creating analytics_consent table...');
        await client.query(`
          CREATE TABLE analytics_consent (
            id UUID PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            status consent_status NOT NULL,
            consent_date TIMESTAMP DEFAULT NOW(),
            consent_version VARCHAR(255) NOT NULL,
            data_usage_accepted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('Created analytics_consent table');
        
        // Create indexes for performance
        await client.query(`CREATE INDEX idx_consent_user_id ON analytics_consent(user_id);`);
        await client.query(`CREATE INDEX idx_consent_date ON analytics_consent(consent_date);`);
        console.log('Created indexes for analytics_consent table');
      }

      // Create pilot tokens table
      if (!existingTables.includes('pilot_tokens')) {
        console.log('Creating pilot_tokens table...');
        await client.query(`
          CREATE TABLE pilot_tokens (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            token VARCHAR(255) NOT NULL UNIQUE,
            participant_type VARCHAR(255) NOT NULL,
            used_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('Created pilot_tokens table');
      }

      // Verify tables were created
      const finalCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens')
      `);
      
      const finalTables = finalCheck.rows.map(row => row.table_name);
      console.log('Final analytics tables list:', finalTables);

      // Count records in each table
      for (const table of finalTables) {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`Table "${table}" has ${countResult.rows[0].count} records`);
      }

      console.log('Analytics tables creation completed successfully');
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error creating analytics tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the function
createTables();
