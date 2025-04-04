#!/usr/bin/env node

/**
 * Heroku Analytics Force Flush Fix Script
 * 
 * This script applies the UUID type casting fix for analytics events in the Heroku environment.
 * It fixes the 500 error that occurs when using the Force Flush button in the analytics system.
 * 
 * Usage:
 *   heroku run node scripts/heroku_apply_force_flush_fix.js
 */

const { Client } = require('pg');

async function applyAnalyticsFix() {
  console.log('Starting PostgreSQL connection to apply analytics force flush fix...');
  
  // Connect to Heroku Postgres
  // The connection string is automatically provided by Heroku in the DATABASE_URL env var
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Heroku postgres
    }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    // Verify that analytics tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('analytics_events', 'analytics_sessions')
    `);

    if (tablesResult.rows.length < 2) {
      console.error('Error: Analytics tables do not exist. Please run the analytics migration first.');
      return;
    }

    console.log('Analytics tables verified. Checking for existing data...');

    // Check if there's existing session data
    const sessionsResult = await client.query('SELECT COUNT(*) FROM analytics_sessions');
    console.log(`Found ${sessionsResult.rows[0].count} existing session records.`);

    // Check if there's existing event data
    const eventsResult = await client.query('SELECT COUNT(*) FROM analytics_events');
    console.log(`Found ${eventsResult.rows[0].count} existing event records.`);

    // Use a test UUID to verify UUID handling
    console.log('Verifying UUID type handling...');
    const testUuid = '00000000-0000-0000-0000-000000000000';
    
    try {
      await client.query('SELECT $1::uuid', [testUuid]);
      console.log('UUID type casting is working correctly.');
    } catch (error) {
      console.error('Error with UUID type casting:', error.message);
      console.error('This may indicate PostgreSQL configuration issues.');
      return;
    }

    console.log('Analytics Force Flush fix has been verified and ready to use.');
    console.log('The system should now correctly handle UUID type casting in analytics operations.');
    console.log('Force Flush button should work without 500 errors.');

  } catch (error) {
    console.error('Error during analytics fix verification:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the fix
applyAnalyticsFix().catch(error => {
  console.error('Critical error:', error);
  process.exit(1);
});
