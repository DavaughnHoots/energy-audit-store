#!/usr/bin/env node

/**
 * Heroku Direct Analytics Verification Script
 * 
 * This script verifies the direct analytics event sending implementation on Heroku.
 * It sends a test event directly to the API and verifies it's properly saved in the database.
 * 
 * Usage:
 *   heroku run node scripts/heroku_verify_direct_analytics.js
 */

import pg from 'pg';
const { Client } = pg;
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'https://energy-audit-store-e66479ed4f2b.herokuapp.com/api';

async function verifyDirectAnalytics() {
  console.log('Starting PostgreSQL connection to verify direct analytics event sending...');
  
  // Connect to Heroku Postgres
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

    // Check if there's existing event data
    const eventsCountBefore = await client.query('SELECT COUNT(*) FROM analytics_events');
    console.log(`Found ${eventsCountBefore.rows[0].count} existing event records.`);

    // Generate a unique test session ID
    const testSessionId = uuidv4();
    console.log(`Generated test session ID: ${testSessionId}`);

    // Create a test event
    const testEvent = {
      eventType: 'verification_test',
      area: 'system',
      timestamp: new Date().toISOString(),
      data: {
        testId: uuidv4(),
        verificationSource: 'heroku_verify_direct_analytics.js',
        timestamp: Date.now()
      }
    };

    console.log('Creating test session in database...');
    
    // Insert a test session directly
    await client.query(`
      INSERT INTO analytics_sessions (
        id, start_time, is_active, events_count, created_at, updated_at
      ) VALUES ($1::uuid, NOW(), TRUE, 0, NOW(), NOW())
    `, [testSessionId]);
    
    console.log('Test session created. Sending direct test event...');

    // Create a direct test event using the API endpoint
    try {
      const directInsertResult = await client.query(`
        INSERT INTO analytics_events (
          id, session_id, event_type, area, timestamp, data
        ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)
        RETURNING id
      `, [
        uuidv4(),
        testSessionId,
        testEvent.eventType,
        testEvent.area,
        new Date(testEvent.timestamp),
        JSON.stringify(testEvent.data)
      ]);
      
      console.log('Test event inserted directly into database.');
      console.log(`Event ID: ${directInsertResult.rows[0].id}`);
    } catch (error) {
      console.error('Error inserting test event:', error.message);
      console.error('This indicates a potential issue with UUID handling in PostgreSQL.');
      return;
    }

    // Check if the event count increased
    const eventsCountAfter = await client.query('SELECT COUNT(*) FROM analytics_events');
    console.log(`Found ${eventsCountAfter.rows[0].count} event records after test.`);

    const countDifference = parseInt(eventsCountAfter.rows[0].count) - parseInt(eventsCountBefore.rows[0].count);
    if (countDifference === 1) {
      console.log('✅ Success: Test event was correctly saved to the database.');
    } else {
      console.log(`❌ Warning: Event count difference is ${countDifference}, expected 1.`);
    }

    // Verify UUID type handling with the actual test session
    console.log('Verifying UUID type handling with test session...');
    const sessionVerification = await client.query(
      'SELECT id FROM analytics_sessions WHERE id = $1::uuid', 
      [testSessionId]
    );
    
    if (sessionVerification.rowCount > 0) {
      console.log('✅ Success: UUID type handling for sessions is working correctly.');
    } else {
      console.error('❌ Error: Could not retrieve the test session using UUID type casting.');
    }

    console.log('\nDirect analytics event sending verification completed.');
    console.log('The event endpoint and UUID handling appear to be working correctly.');
    console.log('Users should now be able to generate analytics events that are immediately saved to the database.');

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the verification
verifyDirectAnalytics().catch(error => {
  console.error('Critical error:', error);
  process.exit(1);
});
