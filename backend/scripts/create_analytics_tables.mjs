/**
 * Script to create analytics tables in the database
 * This will create all required tables for the analytics system if they don't exist
 * 
 * Usage:
 * node backend/scripts/create_analytics_tables.mjs
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get database connection from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not found.');
  console.error('   Please make sure the .env file exists and contains DATABASE_URL');
  process.exit(1);
}

// Create a new database connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createAnalyticsTables() {
  try {
    console.log('🔧 Checking and creating analytics tables...');
    
    // First, check which tables exist
    const tablesQuery = `
      SELECT 
        table_name 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema = 'public' 
        AND table_name IN ('analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens');
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('\n📋 Existing analytics tables:');
    ['analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens'].forEach(tableName => {
      if (existingTables.includes(tableName)) {
        console.log(`   ✅ ${tableName} (already exists)`);
      } else {
        console.log(`   ❌ ${tableName} (will be created)`);
      }
    });
    
    // Create a transaction for all table creations
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create analytics_sessions table if it doesn't exist
      if (!existingTables.includes('analytics_sessions')) {
        console.log('\n📝 Creating analytics_sessions table...');
        await client.query(`
          CREATE TABLE analytics_sessions (
            id UUID PRIMARY KEY,
            user_id TEXT NULL,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            user_agent TEXT NULL,
            ip_address TEXT NULL,
            events_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);
        console.log('   ✅ analytics_sessions table created successfully');
      }
      
      // Create analytics_events table if it doesn't exist
      if (!existingTables.includes('analytics_events')) {
        console.log('\n📝 Creating analytics_events table...');
        await client.query(`
          CREATE TABLE analytics_events (
            id UUID PRIMARY KEY,
            session_id UUID NOT NULL,
            event_type TEXT NOT NULL,
            area TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            data JSONB NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_session
              FOREIGN KEY(session_id)
              REFERENCES analytics_sessions(id)
              ON DELETE CASCADE
          );
        `);
        console.log('   ✅ analytics_events table created successfully');
      }
      
      // Create analytics_consent table if it doesn't exist
      if (!existingTables.includes('analytics_consent')) {
        console.log('\n📝 Creating analytics_consent table...');
        await client.query(`
          CREATE TABLE analytics_consent (
            id UUID PRIMARY KEY,
            user_id TEXT NULL,
            consent_status TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);
        console.log('   ✅ analytics_consent table created successfully');
      }
      
      // Create pilot_tokens table if it doesn't exist
      if (!existingTables.includes('pilot_tokens')) {
        console.log('\n📝 Creating pilot_tokens table...');
        await client.query(`
          CREATE TABLE pilot_tokens (
            id UUID PRIMARY KEY,
            token TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            used_at TIMESTAMP NULL,
            used_by TEXT NULL
          );
        `);
        console.log('   ✅ pilot_tokens table created successfully');
      }
      
      await client.query('COMMIT');
      console.log('\n🎉 All tables created or verified successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Error creating tables:', err);
      console.error('   Transaction rolled back');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

// Execute the function
createAnalyticsTables();
