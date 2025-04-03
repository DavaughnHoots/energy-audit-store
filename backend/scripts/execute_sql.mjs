/**
 * Script to execute SQL directly against the database
 * This can be used to run the analytics_tables.sql script on Heroku
 * 
 * Usage:
 * node backend/scripts/execute_sql.mjs
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get current directory for proper file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database connection from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not found.');
  console.error('   Please make sure the .env file exists and contains DATABASE_URL');
  process.exit(1);
}

// Path to the SQL file
const sqlFilePath = join(__dirname, '..', '..', 'analytics_tables.sql');

// Create a new database connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeSql() {
  try {
    console.log('🔧 Executing SQL script to create analytics tables...');
    
    // Read the SQL file
    let sql;
    try {
      sql = readFileSync(sqlFilePath, 'utf8');
      console.log(`📝 Successfully read SQL file from ${sqlFilePath}`);
    } catch (error) {
      // If the file doesn't exist, use the hardcoded SQL
      console.warn(`⚠️ SQL file not found: ${sqlFilePath}`);
      console.log('📝 Using hardcoded SQL script instead...');
      sql = `
        -- Create analytics_sessions table if it doesn't exist
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analytics_sessions') THEN
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
                RAISE NOTICE 'Created analytics_sessions table';
            ELSE
                RAISE NOTICE 'analytics_sessions table already exists';
            END IF;
        END
        $$;
        
        -- Create analytics_events table if it doesn't exist
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analytics_events') THEN
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
                RAISE NOTICE 'Created analytics_events table';
            ELSE
                RAISE NOTICE 'analytics_events table already exists';
            END IF;
        END
        $$;
        
        -- Create analytics_consent table if it doesn't exist
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analytics_consent') THEN
                CREATE TABLE analytics_consent (
                    id UUID PRIMARY KEY,
                    user_id TEXT NULL,
                    consent_status TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                );
                RAISE NOTICE 'Created analytics_consent table';
            ELSE
                RAISE NOTICE 'analytics_consent table already exists';
            END IF;
        END
        $$;
        
        -- Create pilot_tokens table if it doesn't exist
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pilot_tokens') THEN
                CREATE TABLE pilot_tokens (
                    id UUID PRIMARY KEY,
                    token TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    used_at TIMESTAMP NULL,
                    used_by TEXT NULL
                );
                RAISE NOTICE 'Created pilot_tokens table';
            ELSE
                RAISE NOTICE 'pilot_tokens table already exists';
            END IF;
        END
        $$;
      `;
    }
    
    // Execute the SQL
    const client = await pool.connect();
    try {
      // Check which tables exist before
      const beforeTablesQuery = `
        SELECT 
          table_name 
        FROM 
          information_schema.tables 
        WHERE 
          table_schema = 'public' 
          AND table_name IN ('analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens');
      `;
      const beforeResult = await client.query(beforeTablesQuery);
      const existingTablesBefore = beforeResult.rows.map(row => row.table_name);
      
      console.log('\n📋 Existing analytics tables before script execution:');
      ['analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens'].forEach(tableName => {
        console.log(`   ${existingTablesBefore.includes(tableName) ? '✅' : '❌'} ${tableName}`);
      });
      
      // Execute the SQL script
      console.log('\n🚀 Executing SQL script...');
      await client.query(sql);
      console.log('✅ SQL script executed successfully');
      
      // Check which tables exist after
      const afterTablesQuery = `
        SELECT 
          table_name 
        FROM 
          information_schema.tables 
        WHERE 
          table_schema = 'public' 
          AND table_name IN ('analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens');
      `;
      const afterResult = await client.query(afterTablesQuery);
      const existingTablesAfter = afterResult.rows.map(row => row.table_name);
      
      console.log('\n📋 Existing analytics tables after script execution:');
      ['analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens'].forEach(tableName => {
        console.log(`   ${existingTablesAfter.includes(tableName) ? '✅' : '❌'} ${tableName}`);
      });
      
      // Count the tables created
      const tablesCreated = existingTablesAfter.length - existingTablesBefore.length;
      if (tablesCreated > 0) {
        console.log(`\n🎉 Created ${tablesCreated} new tables!`);
      } else {
        console.log('\n📝 No new tables were created. All required tables already exist.');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

// Execute the function
executeSql();
