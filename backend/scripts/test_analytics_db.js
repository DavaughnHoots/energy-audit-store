/**
 * Simple script to directly test database connectivity and analytics tables
 */

import pg from 'pg';
const { Pool } = pg;

const main = async () => {
  console.log('🔍 Testing direct database connection...');
  
  try {
    // Create a new connection pool
    const pool = new Pool();
    
    console.log('✅ Pool created, testing connection...');
    
    // Test basic connectivity
    const connResult = await pool.query('SELECT NOW() as time');
    console.log(`✅ Connection successful! Server time: ${connResult.rows[0].time}`);
    
    // Check if analytics tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'analytics%'
    `;
    const tablesResult = await pool.query(tablesQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No analytics tables found!');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} analytics tables:`);
      tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
    }
    
    // Test inserting a sample analytics event
    try {
      console.log('🔍 Attempting to insert a test event...');
      
      const sessionId = '00000000-0000-0000-0000-000000000001'; // Test UUID
      const eventId = '00000000-0000-0000-0000-000000000002'; // Test UUID
      
      // First, try to find if this test session exists
      const sessionCheck = await pool.query(
        'SELECT id FROM analytics_sessions WHERE id = $1',
        [sessionId]
      );
      
      // If test session doesn't exist, create it
      if (sessionCheck.rowCount === 0) {
        console.log('- Creating test session record...');
        await pool.query(
          `INSERT INTO analytics_sessions (
            id, start_time, is_active, events_count, created_at, updated_at
          ) VALUES ($1, NOW(), TRUE, 0, NOW(), NOW())`,
          [sessionId]
        );
        console.log('✅ Test session created');
      } else {
        console.log('✅ Test session already exists');
      }
      
      // Now try to insert a test event
      const eventInsert = await pool.query(
        `INSERT INTO analytics_events (
          id, session_id, user_id, event_type, area, timestamp, data, created_at
        ) VALUES ($1, $2, NULL, $3, $4, NOW(), $5, NOW())
        ON CONFLICT (id) DO NOTHING
        RETURNING id`,
        [eventId, sessionId, 'test_event', 'test_area', JSON.stringify({ test: true })]
      );
      
      if (eventInsert.rowCount > 0) {
        console.log('✅ Test event inserted successfully');
      } else {
        console.log('ℹ️ Test event already exists or couldn\'t be inserted');
      }
      
      // Update the session events count
      await pool.query(
        'UPDATE analytics_sessions SET events_count = events_count + 1 WHERE id = $1',
        [sessionId]
      );
      
      // Test retrieving events for this session
      const eventsGet = await pool.query(
        'SELECT * FROM analytics_events WHERE session_id = $1',
        [sessionId]
      );
      
      console.log(`✅ Found ${eventsGet.rowCount} events for test session`);
      
    } catch (insertError) {
      console.log('❌ Error during test event insertion:', insertError);
      console.log('Detailed error:', JSON.stringify(insertError, null, 2));
    }
    
    // Close the pool
    await pool.end();
    console.log('✅ Pool closed successfully');
    
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error(error);
    
    // Additional diagnostics for common pg errors
    if (error.code === 'ECONNREFUSED') {
      console.error('  → The database server appears to be down or not accepting connections');
    } else if (error.code === '28P01') {
      console.error('  → Authentication failed - incorrect username/password');
    } else if (error.code === '3D000') {
      console.error('  → Database does not exist');
    }
    
    process.exit(1);
  }
};

main().catch(err => {
  console.error('Unhandled error in main function:', err);
});
