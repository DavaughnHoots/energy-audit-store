#!/usr/bin/env node

// Script to run the analytics tables migration directly
// Usage: node run_migration.js

const { Sequelize } = require('sequelize');
const migrationScript = require('../migrations/20250404_add_analytics_tables');

async function runMigration() {
  // Use the DATABASE_URL environment variable provided by Heroku
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable not found');
    process.exit(1);
  }
  
  console.log('Connecting to database...');
  
  // Create a Sequelize instance with the database URL
  const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
  
  try {
    await sequelize.authenticate();
    console.log('Connection to database established successfully');
    
    console.log('Running migration...');
    await migrationScript.up(sequelize.getQueryInterface(), Sequelize);
    console.log('Migration executed successfully');
    
    // Check if tables were created
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'analytics%'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('\nVerifying tables:');
    if (tables.length > 0) {
      tables.forEach(table => {
        console.log(`- ${table.table_name} has been created`);
      });
    } else {
      console.log('No analytics tables found. Something went wrong!');
    }
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(err => {
  console.error('Failed to run migration:', err);
  process.exit(1);
});
