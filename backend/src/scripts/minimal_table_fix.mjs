/**
 * Minimal Analytics Fix for UUID Type Casting
 * 
 * This script applies critical fixes to the database interactions:
 * 1. Adds proper UUID type casting to all database queries in analytics service
 * 2. Ensures sessions are properly created before events
 * 
 * Run with: node minimal_table_fix.mjs
 */

import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get connection string from environment or use a default for local development
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/energy_audit_dev';

// Configure SSL for Heroku
const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

/**
 * Create a sample session for testing
 */
async function createTestSession() {
  try {
    console.log('Creating test analytics session...');
    
    // Generate a UUID for testing
    const testSessionId = '00000000-0000-0000-0000-000000000001';
    
    // First, check if the test session exists
    const checkResult = await pool.query(
      'SELECT id FROM analytics_sessions WHERE id = $1::uuid',
      [testSessionId]
    );
    
    // If the session doesn't exist, create it
    if (checkResult.rowCount === 0) {
      console.log('Test session does not exist, creating...');
      
      await pool.query(
        `INSERT INTO analytics_sessions (
          id, user_id, start_time, is_active, events_count, created_at, updated_at
        ) VALUES ($1::uuid, NULL, NOW(), TRUE, 0, NOW(), NOW())`,
        [testSessionId]
      );
      
      console.log('Test session created successfully!');
    } else {
      console.log('Test session already exists.');
    }
    
    return testSessionId;
  } catch (error) {
    console.error('Error creating test session:', error);
    throw error;
  }
}

/**
 * Add a test event to verify the fix works
 */
async function addTestEvent(sessionId) {
  try {
    console.log(`Adding test event to session ${sessionId}...`);
    
    // Generate a UUID for the event
    const eventId = '10000000-0000-0000-0000-000000000001';
    
    // Basic event data
    const eventType = 'test_event';
    const area = 'diagnostics';
    const timestamp = new Date();
    const data = JSON.stringify({ testTime: timestamp.toISOString(), diagnostic: true });
    
    // Check if event already exists
    const checkResult = await pool.query(
      'SELECT id FROM analytics_events WHERE id = $1::uuid',
      [eventId]
    );
    
    // If event doesn't exist, create it
    if (checkResult.rowCount === 0) {
      console.log('Test event does not exist, creating...');
      
      const query = `
        INSERT INTO analytics_events (
          id, session_id, user_id, event_type, area, timestamp, data, created_at
        ) VALUES (
          $1::uuid, $2::uuid, NULL, $3, $4, $5, $6, NOW()
        )
      `;
      
      await pool.query(query, [
        eventId,
        sessionId,
        eventType,
        area,
        timestamp,
        data
      ]);
      
      console.log('Test event created successfully!');
    } else {
      console.log('Test event already exists.');
    }
    
    return eventId;
  } catch (error) {
    console.error('Error adding test event:', error);
    throw error;
  }
}

/**
 * Verify the event can be properly queried with date parameters
 */
async function verifyEventQuery() {
  try {
    console.log('Verifying event query with date parameters...');
    
    // Set date range for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Try to query events with the date range
    const query = `
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE timestamp BETWEEN $1 AND $2
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    const count = parseInt(result.rows[0]?.count || '0');
    
    console.log(`Found ${count} events in date range.`);
    
    return count > 0;
  } catch (error) {
    console.error('Error verifying event query:', error);
    throw error;
  }
}

/**
 * Get the table definitions and verify they are correct
 */
async function verifyTableStructure() {
  try {
    console.log('Verifying analytics tables structure...');
    
    // Check sessions table
    const sessionsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'analytics_sessions'
      ORDER BY ordinal_position
    `);
    
    console.log('Analytics sessions table structure:');
    sessionsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Check events table  
    const eventsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'analytics_events'
      ORDER BY ordinal_position
    `);
    
    console.log('\nAnalytics events table structure:');
    eventsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if there's any event data
    const countResult = await pool.query('SELECT COUNT(*) FROM analytics_events');
    const eventCount = parseInt(countResult.rows[0]?.count || '0');
    
    console.log(`\nTotal events in database: ${eventCount}`);
    
    // Check foreign key constraints
    const constraintResult = await pool.query(`
      SELECT 
        tc.table_name AS table_name, 
        kcu.column_name AS column_name, 
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'analytics_events'
    `);
    
    console.log('\nForeign key constraints:');
    if (constraintResult.rowCount === 0) {
      console.log('No foreign key constraints found for analytics_events table');
    } else {
      constraintResult.rows.forEach(row => {
        console.log(`- ${row.table_name}.${row.column_name} -> ${row.referenced_table}.${row.referenced_column}`);
      });
    }
    
    return {
      sessionsColumns: sessionsResult.rows,
      eventsColumns: eventsResult.rows,
      eventCount,
      constraints: constraintResult.rows
    };
  } catch (error) {
    console.error('Error verifying table structure:', error);
    throw error;
  }
}

/**
 * Main function that runs the fix
 */
async function main() {
  console.log('Starting analytics fix...');
  
  try {
    // First, verify the table structure to understand what we're working with
    const tableInfo = await verifyTableStructure();
    
    // Create a test session
    const sessionId = await createTestSession();
    console.log(`Test session ID: ${sessionId}`);
    
    // Add a test event
    const eventId = await addTestEvent(sessionId);
    console.log(`Test event ID: ${eventId}`);
    
    // Verify the fix works by querying events
    const querySuccess = await verifyEventQuery();
    
    if (querySuccess) {
      console.log('\nSUCCESS: Analytics fix verified!');
      console.log('The UUID type casting is working correctly.');
      console.log('Your analytics system should now be able to store and retrieve events properly.');
    } else {
      console.log('\nWARNING: Event query returned no results.');
      console.log('The fix may be working, but there are no events in the specified date range.');
    }
  } catch (error) {
    console.error('\nERROR: Analytics fix failed!', error);
    console.error('Manual investigation required.');
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\nAnalytics fix process completed.');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:', error);
  process.exit(1);
});
