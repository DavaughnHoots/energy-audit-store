/**
 * Migration for creating analytics tables
 */

exports.up = async function(knex) {
  // Check if sessions table exists
  const hasSessionsTable = await knex.schema.hasTable('analytics_sessions');
  
  if (!hasSessionsTable) {
    console.log('Creating analytics_sessions table...');
    await knex.schema.createTable('analytics_sessions', table => {
      table.uuid('id').primary();
      table.uuid('user_id').nullable();
      table.timestamp('first_activity').defaultTo(knex.fn.now());
      table.timestamp('last_activity').defaultTo(knex.fn.now());
    });
  }

  // Check if events table exists
  const hasEventsTable = await knex.schema.hasTable('analytics_events');
  
  if (!hasEventsTable) {
    console.log('Creating analytics_events table...');
    await knex.schema.createTable('analytics_events', table => {
      table.increments('id').primary();
      table.uuid('session_id').notNullable().references('id').inTable('analytics_sessions');
      table.string('event_type', 255).notNullable();
      table.string('area', 255).notNullable();
      table.jsonb('event_data').notNullable().defaultTo('{}');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });

    // Add indexes for analytics_events
    await knex.schema.table('analytics_events', table => {
      table.index('session_id', 'idx_analytics_events_session_id');
      table.index('event_type', 'idx_analytics_events_event_type');
      table.index('area', 'idx_analytics_events_area');
      table.index('created_at', 'idx_analytics_events_created_at');
    });
  }

  // Check if reports table exists
  const hasReportsTable = await knex.schema.hasTable('analytics_reports');
  
  if (!hasReportsTable) {
    console.log('Creating analytics_reports table...');
    await knex.schema.createTable('analytics_reports', table => {
      table.uuid('id').primary();
      table.string('timeframe', 50).notNullable();
      table.jsonb('metrics').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // Add indexes for analytics_sessions if table already existed
  if (hasSessionsTable) {
    // Check if index exists before creating it
    const sessionIndexes = await knex.raw(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'analytics_sessions' AND indexname = 'idx_analytics_sessions_user_id'"
    );
    
    if (sessionIndexes.rows.length === 0) {
      await knex.schema.table('analytics_sessions', table => {
        table.index('user_id', 'idx_analytics_sessions_user_id');
      });
    }
  }

  // Insert test data to verify functionality
  console.log('Inserting test data to verify functionality...');
  
  // Create a test session if it doesn't exist
  const testSessionId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const existingSession = await knex('analytics_sessions')
    .where({ id: testSessionId })
    .first();
    
  if (!existingSession) {
    await knex('analytics_sessions').insert({
      id: testSessionId,
      first_activity: new Date(),
      last_activity: new Date()
    });
  }
  
  // Insert a test event
  await knex('analytics_events').insert({
    session_id: testSessionId,
    event_type: 'migration_test',
    area: 'system',
    event_data: JSON.stringify({ source: 'migration', test: true }),
    created_at: new Date()
  });
  
  console.log('Migration completed successfully!');
};

exports.down = async function(knex) {
  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists('analytics_events');
  await knex.schema.dropTableIfExists('analytics_reports');
  await knex.schema.dropTableIfExists('analytics_sessions');
};
