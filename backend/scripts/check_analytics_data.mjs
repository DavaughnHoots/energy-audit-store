/**
 * Script to check if analytics data is being properly stored in the database
 * This is useful for verifying the analytics fix has been applied correctly
 * 
 * Usage: 
 * node backend/scripts/check_analytics_data.mjs
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get database connection from environment variables
const connectionString = process.env.DATABASE_URL;
const { Pool } = pg;

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

async function checkAllAnalyticsTables() {
  try {
    console.log('🔍 Checking analytics tables in the database...');
    
    // Check if tables exist
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
    
    // List existing tables
    console.log('\n📋 Existing analytics tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   No analytics tables found! Tables need to be created.');
    } else {
      const existingTables = tablesResult.rows.map(row => row.table_name);
      const allRequired = ['analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens'];
      
      allRequired.forEach(tableName => {
        if (existingTables.includes(tableName)) {
          console.log(`   ✅ ${tableName}`);
        } else {
          console.log(`   ❌ ${tableName} (missing)`);
        }
      });
    }
    
    // Check analytics_events count
    if (tablesResult.rows.some(row => row.table_name === 'analytics_events')) {
      const eventsQuery = 'SELECT COUNT(*) as count FROM analytics_events';
      const eventsResult = await pool.query(eventsQuery);
      console.log(`\n📊 Total analytics events: ${eventsResult.rows[0].count}`);
      
      // Get event types breakdown
      const eventTypesQuery = `
        SELECT event_type, COUNT(*) as count 
        FROM analytics_events 
        GROUP BY event_type 
        ORDER BY count DESC
      `;
      const eventTypesResult = await pool.query(eventTypesQuery);
      
      console.log('\n📊 Events by type:');
      if (eventTypesResult.rows.length === 0) {
        console.log('   No events found in the database.');
      } else {
        eventTypesResult.rows.forEach(row => {
          console.log(`   - ${row.event_type}: ${row.count}`);
        });
      }
      
      // Check recent events
      const recentEventsQuery = `
        SELECT event_type, area, timestamp, data
        FROM analytics_events
        ORDER BY timestamp DESC
        LIMIT 5
      `;
      const recentEventsResult = await pool.query(recentEventsQuery);
      
      console.log('\n🕒 5 most recent events:');
      if (recentEventsResult.rows.length === 0) {
        console.log('   No events found in the database.');
      } else {
        recentEventsResult.rows.forEach((row, index) => {
          const eventTime = new Date(row.timestamp).toLocaleString();
          console.log(`   ${index + 1}. [${eventTime}] ${row.event_type} in "${row.area}"`);
          try {
            // Try to parse the data JSON
            const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            if (Object.keys(data).length > 0) {
              console.log(`      Data: ${JSON.stringify(data)}`);
            }
          } catch (e) {
            console.log('      Data: (Invalid JSON)');
          }
        });
      }
    }
    
    // Check sessions
    if (tablesResult.rows.some(row => row.table_name === 'analytics_sessions')) {
      const sessionsQuery = 'SELECT COUNT(*) as count FROM analytics_sessions';
      const activeSessionsQuery = 'SELECT COUNT(*) as count FROM analytics_sessions WHERE is_active = true';
      
      const sessionsResult = await pool.query(sessionsQuery);
      const activeSessionsResult = await pool.query(activeSessionsQuery);
      
      console.log(`\n👤 Total sessions: ${sessionsResult.rows[0].count}`);
      console.log(`   Active sessions: ${activeSessionsResult.rows[0].count}`);
      
      // Get the most recent session
      const recentSessionQuery = `
        SELECT id, user_id, start_time, events_count, is_active
        FROM analytics_sessions
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const recentSessionResult = await pool.query(recentSessionQuery);
      
      if (recentSessionResult.rows.length > 0) {
        const session = recentSessionResult.rows[0];
        console.log('\n🆕 Most recent session:');
        console.log(`   ID: ${session.id}`);
        console.log(`   User: ${session.user_id || 'Anonymous'}`);
        console.log(`   Started: ${new Date(session.start_time).toLocaleString()}`);
        console.log(`   Events count: ${session.events_count}`);
        console.log(`   Active: ${session.is_active ? 'Yes' : 'No'}`);
      }
    }
    
    // Check pilot tokens
    if (tablesResult.rows.some(row => row.table_name === 'pilot_tokens')) {
      const tokensQuery = 'SELECT COUNT(*) as count FROM pilot_tokens';
      const usedTokensQuery = 'SELECT COUNT(*) as count FROM pilot_tokens WHERE used_at IS NOT NULL';
      
      const tokensResult = await pool.query(tokensQuery);
      const usedTokensResult = await pool.query(usedTokensQuery);
      
      console.log(`\n🎟️ Pilot tokens: ${tokensResult.rows[0].count}`);
      console.log(`   Used tokens: ${usedTokensResult.rows[0].count}`);
    }
    
    console.log('\n✅ Analytics check completed.');
  } catch (error) {
    console.error('❌ Error checking analytics data:', error);
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

checkAllAnalyticsTables();
