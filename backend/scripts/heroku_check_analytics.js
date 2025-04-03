#!/usr/bin/env node

/**
 * Diagnostic script to check analytics data in the database
 * 
 * For use directly on Heroku: 
 * heroku run "node backend/scripts/heroku_check_analytics.js" --app energy-audit-store
 */

// Function to connect to database and check analytics tables
async function connectAndCheckDatabase(Pool) {
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
      AND (table_name LIKE 'analytics%' OR table_name = 'admin_config' OR table_name = 'pilot_tokens')
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
    
    // Execute direct table creation SQL if tables are missing
    const shouldCreateTables = tableResults.rows.length === 0 || 
      !tableResults.rows.some(r => r.table_name === 'analytics_events') ||
      !tableResults.rows.some(r => r.table_name === 'analytics_sessions');
    
    if (shouldCreateTables) {
      console.log('\n🛠️ Creating missing analytics tables...');
      
      const createTablesSQL = `
      -- Create admin_config table
      CREATE TABLE IF NOT EXISTS admin_config (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Add admin password if it doesn't exist
      INSERT INTO admin_config (key, value)
      VALUES ('admin_password', 'PilotStudy2025!')
      ON CONFLICT (key) DO NOTHING;

      -- Create analytics_events table
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY,
        session_id UUID NOT NULL,
        user_id UUID,
        event_type VARCHAR(50) NOT NULL,
        area VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Create indexes for analytics_events
      CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_area ON analytics_events(area);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

      -- Create analytics_sessions table
      CREATE TABLE IF NOT EXISTS analytics_sessions (
        id UUID PRIMARY KEY,
        user_id UUID,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER,
        user_agent VARCHAR(255),
        device_type VARCHAR(50),
        screen_size VARCHAR(50),
        referrer VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        events_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Create indexes for analytics_sessions
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start_time ON analytics_sessions(start_time);
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_is_active ON analytics_sessions(is_active);

      -- Create analytics_consent table
      CREATE TABLE IF NOT EXISTS analytics_consent (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        status VARCHAR(20) NOT NULL,
        consent_date TIMESTAMP NOT NULL,
        consent_version VARCHAR(20) NOT NULL,
        data_usage_accepted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Create indexes for analytics_consent
      CREATE INDEX IF NOT EXISTS idx_analytics_consent_user_id ON analytics_consent(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_consent_status ON analytics_consent(status);

      -- Create analytics_feature_metrics table
      CREATE TABLE IF NOT EXISTS analytics_feature_metrics (
        id SERIAL PRIMARY KEY,
        feature_id VARCHAR(100) NOT NULL,
        feature_category VARCHAR(50),
        usage_count INTEGER NOT NULL DEFAULT 0,
        unique_users INTEGER NOT NULL DEFAULT 0,
        last_used TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Create index for analytics_feature_metrics
      CREATE INDEX IF NOT EXISTS idx_analytics_feature_metrics_feature_id ON analytics_feature_metrics(feature_id);
      `;
      
      try {
        await client.query(createTablesSQL);
        console.log('✅ Analytics tables created successfully');
        
        // Verify tables were created
        const verifyResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'analytics%'");
        console.log('\nVerifying tables:');
        verifyResult.rows.forEach(row => {
          console.log(`- ${row.table_name} has been created`);
        });
      } catch (error) {
        console.error('❌ Error creating tables:', error.message);
      }
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

// Main function to check analytics tables
async function checkAnalyticsTables() {
  try {
    // First attempt: Try to dynamically import pg module at runtime
    const pg = await import('pg');
    const { Pool } = pg.default;
    
    // If import succeeds, proceed with database connection
    await connectAndCheckDatabase(Pool);
    
  } catch (error) {
    console.error('❌ Error loading pg module:', error.message);
    
    // Check if this is a module not found error
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('📦 Attempting to install pg module...');
      
      try {
        // Import child_process module to run npm install
        const { execSync } = await import('child_process');
        
        // Install pg module without saving to package.json
        execSync('npm install pg --no-save', { stdio: 'inherit' });
        console.log('✅ pg module installed successfully');
        
        // Try importing pg again after installation
        try {
          const pg = await import('pg');
          const { Pool } = pg.default;
          console.log('✅ Successfully imported pg module after installation');
          
          // Now connect to the database and run checks
          await connectAndCheckDatabase(Pool);
          
        } catch (secondImportError) {
          console.error('❌ Failed to import pg module after installation:', secondImportError.message);
        }
      } catch (installError) {
        console.error('❌ Failed to install pg module:', installError.message);
        console.error('This may be due to permission issues or network connectivity problems');
      }
    } else {
      console.error('This may be an issue with the module resolution in the Heroku environment');
    }
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
