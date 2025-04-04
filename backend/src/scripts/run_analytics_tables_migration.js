/**
 * Script to run the analytics tables migration
 * 
 * This script runs the 20250404_create_analytics_tables.js migration
 * to create the necessary analytics tables in the database.
 * 
 * Run with: node backend/src/scripts/run_analytics_tables_migration.js
 */

const path = require('path');
const knex = require('../config/database').knexInstance;

const MIGRATION_NAME = '20250404_create_analytics_tables.js';

async function runMigration() {
  try {
    console.log('='.repeat(50));
    console.log('Running Analytics Tables Migration');
    console.log('='.repeat(50));
    
    // Get the migrations directory path
    const migrationsDir = path.join(__dirname, '../migrations');
    
    // Get the specific migration file path
    const migrationPath = path.join(migrationsDir, MIGRATION_NAME);
    
    console.log(`Loading migration from: ${migrationPath}`);
    
    // Load the migration file
    const migration = require(migrationPath);
    
    // Run the up function
    console.log('Running migration...');
    await migration.up(knex);
    
    console.log('='.repeat(50));
    console.log('✅ Analytics tables migration completed successfully!');
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Close the database connection
    await knex.destroy();
  }
}

// Run the migration
runMigration();
