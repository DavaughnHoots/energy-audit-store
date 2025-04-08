// scripts/check_analytics_events_db.js
// Check if analytics events are being correctly stored in the database

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize database client
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAnalyticsEvents() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to the database');

    // Check if analytics_events table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'analytics_events'
      );
    `;
    
    const tableExists = await client.query(tableCheckQuery);
    
    if (!tableExists.rows[0].exists) {
      console.error('ERROR: analytics_events table does not exist');
      return;
    }
    
    console.log('✓ analytics_events table exists');
    
    // Get total count of events
    const countQuery = 'SELECT COUNT(*) FROM analytics_events;';
    const countResult = await client.query(countQuery);
    const totalEvents = parseInt(countResult.rows[0].count);
    
    console.log(`Total events in database: ${totalEvents}`);
    
    // Get events by type
    const typeQuery = `
      SELECT event_type, COUNT(*) 
      FROM analytics_events 
      GROUP BY event_type 
      ORDER BY COUNT(*) DESC;
    `;
    
    const typeResult = await client.query(typeQuery);
    
    console.log('\nEvents by type:');
    typeResult.rows.forEach(row => {
      console.log(`- ${row.event_type}: ${row.count}`);
    });
    
    // Get events by area
    const areaQuery = `
      SELECT area, COUNT(*) 
      FROM analytics_events 
      GROUP BY area 
      ORDER BY COUNT(*) DESC;
    `;
    
    const areaResult = await client.query(areaQuery);
    
    console.log('\nEvents by area:');
    areaResult.rows.forEach(row => {
      console.log(`- ${row.area}: ${row.count}`);
    });
    
    // Get most recent events
    const recentQuery = `
      SELECT id, event_type, area, created_at, data
      FROM analytics_events
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    
    const recentResult = await client.query(recentQuery);
    
    console.log('\nMost recent events:');
    recentResult.rows.forEach(row => {
      console.log(`[${new Date(row.created_at).toLocaleString()}] ${row.event_type} in ${row.area}`);
      console.log(`  Data: ${JSON.stringify(row.data)}`);
      console.log('---');
    });
    
    // Check for page_view events
    const pageViewQuery = `
      SELECT COUNT(*) 
      FROM analytics_events 
      WHERE event_type = 'page_view';
    `;
    
    const pageViewResult = await client.query(pageViewQuery);
    const pageViewCount = parseInt(pageViewResult.rows[0].count);
    
    console.log(`\nPage view events: ${pageViewCount}`);
    
    if (pageViewCount === 0) {
      console.error('WARNING: No page_view events found. Page tracking may not be working properly.');
    }
    
    // Check for component_interaction events
    const componentQuery = `
      SELECT COUNT(*) 
      FROM analytics_events 
      WHERE event_type = 'component_interaction';
    `;
    
    const componentResult = await client.query(componentQuery);
    const componentCount = parseInt(componentResult.rows[0].count);
    
    console.log(`Component interaction events: ${componentCount}`);
    
    if (componentCount === 0) {
      console.error('WARNING: No component_interaction events found. Component tracking may not be working properly.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the check
checkAnalyticsEvents();
