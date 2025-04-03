#!/usr/bin/env node

/**
 * Diagnostic script to check analytics data in the database
 * This script connects to the Heroku Postgres database and examines the analytics tables
 * 
 * Usage: 
 * 1. Local: node backend/src/scripts/check_analytics_data.js
 * 2. Heroku: heroku run "node backend/src/scripts/check_analytics_data.js" --app energy-audit-store
 */

const { Pool } = require('pg');

async function checkAnalyticsTables() {
  // Connect to database using DATABASE_URL from environment
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Heroku Postgres
    }
  });

  console.log('🔍 Connecting to database...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database');
    
    // Check which analytics tables exist
    console.log('\n📊 Checking for analytics tables:');
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'analytics%' OR table_name = 'admin_config' OR table_name = 'pilot_tokens'
    `;
    
    const tableResults = await client.query(tableCheckQuery);
    
    if (tableResults.rows.length === 0) {
      console.log('❌ No analytics tables found! Database setup is incomplete.');
      return;
    }
    
    console.log('Found tables:');
    tableResults.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check analytics_events table
    console.log('\n📝 Checking analytics_events table:');
    try {
      const eventsCountQuery = `SELECT COUNT(*) as count FROM analytics_events`;
      const eventsCountResult = await client.query(eventsCountQuery);
      console.log(`Total events: ${eventsCountResult.rows[0].count}`);
      
      if (parseInt(eventsCountResult.rows[0].count) > 0) {
        // Show recent events
        const recentEventsQuery = `
          SELECT id, session_id, event_type, area, timestamp, data
          FROM analytics_events
          ORDER BY timestamp DESC
          LIMIT 5
        `;
        
        const recentEvents = await client.query(recentEventsQuery);
        console.log('\nMost recent events:');
        recentEvents.rows.forEach((event, i) => {
          console.log(`\nEvent #${i+1}:`);
          console.log(`- ID: ${event.id}`);
          console.log(`- Session: ${event.session_id}`);
          console.log(`- Type: ${event.event_type}`);
          console.log(`- Area: ${event.area}`);
          console.log(`- Timestamp: ${event.timestamp}`);
          console.log(`- Data: ${JSON.stringify(event.data, null, 2)}`);
        });
        
        // Show event counts by type
        const eventTypeQuery = `
          SELECT event_type, COUNT(*) as count
          FROM analytics_events
          GROUP BY event_type
          ORDER BY count DESC
        `;
        
        const eventTypeResults = await client.query(eventTypeQuery);
        console.log('\nEvent counts by type:');
        eventTypeResults.rows.forEach(row => {
          console.log(`- ${row.event_type}: ${row.count}`);
        });
        
        // Show event counts by area
        const eventAreaQuery = `
          SELECT area, COUNT(*) as count
          FROM analytics_events
          GROUP BY area
          ORDER BY count DESC
        `;
        
        const eventAreaResults = await client.query(eventAreaQuery);
        console.log('\nEvent counts by area:');
        eventAreaResults.rows.forEach(row => {
          console.log(`- ${row.area}: ${row.count}`);
        });
      } else {
        console.log('❌ No events found in analytics_events table!');
      }
    } catch (error) {
      console.error('❌ Error accessing analytics_events table:', error.message);
    }
    
    // Check analytics_sessions table
    console.log('\n👤 Checking analytics_sessions table:');
    try {
      const sessionsCountQuery = `SELECT COUNT(*) as count FROM analytics_sessions`;
      const sessionsCountResult = await client.query(sessionsCountQuery);
      console.log(`Total sessions: ${sessionsCountResult.rows[0].count}`);
      
      if (parseInt(sessionsCountResult.rows[0].count) > 0) {
        // Show recent sessions
        const recentSessionsQuery = `
          SELECT id, user_id, start_time, end_time, duration, is_active, events_count
          FROM analytics_sessions
          ORDER BY start_time DESC
          LIMIT 5
        `;
        
        const recentSessions = await client.query(recentSessionsQuery);
        console.log('\nMost recent sessions:');
        recentSessions.rows.forEach((session, i) => {
          console.log(`\nSession #${i+1}:`);
          console.log(`- ID: ${session.id}`);
          console.log(`- User: ${session.user_id || 'Anonymous'}`);
          console.log(`- Start: ${session.start_time}`);
          console.log(`- End: ${session.end_time || 'Still active'}`);
          console.log(`- Duration: ${session.duration || 'N/A'}`);
          console.log(`- Active: ${session.is_active}`);
          console.log(`- Events: ${session.events_count}`);
        });
      } else {
        console.log('❌ No sessions found in analytics_sessions table!');
      }
    } catch (error) {
      console.error('❌ Error accessing analytics_sessions table:', error.message);
    }
    
    // Check for next-day data range (to confirm future date handling)
    console.log('\n📅 Checking for data with future timestamps:');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const futureEventsQuery = `
        SELECT COUNT(*) as count
        FROM analytics_events
        WHERE timestamp >= $1
      `;
      
      const futureEventsResult = await client.query(futureEventsQuery, [tomorrowStr]);
      console.log(`Events with future dates (>= ${tomorrowStr}): ${futureEventsResult.rows[0].count}`);
      
      if (parseInt(futureEventsResult.rows[0].count) > 0) {
        console.log('✅ Found events with future timestamps - this confirms our date handling is working properly');
      } else {
        console.log('⚠️ No future-dated events found. This may be expected if no future-dated events exist.');
      }
    } catch (error) {
      console.error('❌ Error checking future events:', error.message);
    }
    
    // Close the client
    client.release();
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    if (error.message.includes('no pg_hba.conf entry')) {
      console.log('This may be an issue with firewall or network settings');
    } else if (error.message.includes('password authentication failed')) {
      console.log('This may be an issue with database credentials');
    }
  } finally {
    await pool.end();
  }
}

// Run the diagnostic function
checkAnalyticsTables()
  .then(() => {
    console.log('\n🔍 Analytics database check complete');
  })
  .catch(err => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });
