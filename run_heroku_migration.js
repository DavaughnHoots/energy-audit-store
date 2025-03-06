/**
 * Script to run the visualization data table migration on Heroku
 * 
 * Usage:
 * node run_heroku_migration.js
 * 
 * This script will connect to the Heroku database and run the visualization data table migration.
 * It requires the HEROKU_DATABASE_URL environment variable to be set.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MIGRATION_FILE = path.join(__dirname, 'backend/src/migrations/add_visualization_data_table.sql');
const LOG_FILE = path.join(__dirname, 'heroku_migration.log');

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Helper function to execute shell commands
function executeCommand(command) {
  log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    log('Command executed successfully');
    return output;
  } catch (error) {
    log(`Error executing command: ${error.message}`);
    throw error;
  }
}

// Main function
async function runMigration() {
  log('Starting Heroku migration for visualization data table');

  try {
    // Check if HEROKU_DATABASE_URL is set
    if (!process.env.HEROKU_DATABASE_URL) {
      log('Error: HEROKU_DATABASE_URL environment variable is not set');
      log('Please set the HEROKU_DATABASE_URL environment variable and try again');
      log('You can get the database URL by running: heroku config:get DATABASE_URL -a your-app-name');
      process.exit(1);
    }

    // Check if the migration file exists
    if (!fs.existsSync(MIGRATION_FILE)) {
      log(`Error: Migration file not found at ${MIGRATION_FILE}`);
      process.exit(1);
    }

    // Read the migration file
    const migrationSql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    log(`Migration file read successfully (${migrationSql.length} bytes)`);

    // Create a temporary file with the migration SQL
    const tempFile = path.join(__dirname, 'temp_migration.sql');
    fs.writeFileSync(tempFile, migrationSql);
    log(`Temporary migration file created at ${tempFile}`);

    // Run the migration on Heroku
    log('Running migration on Heroku database...');
    executeCommand(`heroku pg:psql --app energy-audit-store < ${tempFile}`);
    log('Migration completed successfully');

    // Clean up the temporary file
    fs.unlinkSync(tempFile);
    log('Temporary migration file deleted');

    // Record the migration in the migrations table
    const recordMigrationSql = `
      INSERT INTO migrations (name, applied_at) 
      VALUES ('add_visualization_data_table', CURRENT_TIMESTAMP) 
      ON CONFLICT (name) DO NOTHING;
    `;
    const recordMigrationFile = path.join(__dirname, 'temp_record_migration.sql');
    fs.writeFileSync(recordMigrationFile, recordMigrationSql);
    executeCommand(`heroku pg:psql --app energy-audit-store < ${recordMigrationFile}`);
    fs.unlinkSync(recordMigrationFile);
    log('Migration recorded in migrations table');

    log('Heroku migration completed successfully');
  } catch (error) {
    log(`Error running Heroku migration: ${error.message}`);
    if (error.stack) {
      log(`Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run the migration
runMigration();
