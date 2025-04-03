/**
 * Script to run the analytics tables migration (ES Module version)
 * 
 * This script specifically runs the 20250404_add_analytics_tables.js migration
 * to ensure the analytics tables are properly created in the database.
 */

import 'dotenv/config';
import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('Starting analytics tables migration...');
  
  try {
    // Create Sequelize instance from env variables
    const sequelize = new Sequelize(
      process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/energy_audit',
      {
        dialect: 'postgres',
        dialectOptions: {
          ssl: process.env.DATABASE_URL ? {
            require: true,
            rejectUnauthorized: false
          } : false
        },
        logging: console.log
      }
    );

    // Test the connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Import the migration directly
    const migrationPath = path.join(__dirname, '../migrations/20250404_add_analytics_tables.js');
    const migration = await import(migrationPath);

    console.log('Running migration directly...');
    await migration.default.up(sequelize.getQueryInterface(), Sequelize);
    console.log('Migration executed successfully');

    // Run some diagnostics
    console.log('Running diagnostics...');
    const tableChecks = [
      'analytics_events',
      'analytics_sessions',
      'analytics_consent',
      'pilot_tokens'
    ];

    for (const table of tableChecks) {
      try {
        const result = await sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${table}'
          ) as exists`
        );
        
        const exists = result[0][0].exists;
        if (exists) {
          const countResult = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}"`);
          const count = parseInt(countResult[0][0].count);
          console.log(`Table "${table}" exists with ${count} records`);
        } else {
          console.log(`Table "${table}" does not exist!`);
        }
      } catch (error) {
        console.error(`Error checking table "${table}":`, error.message);
      }
    }

    console.log('Analytics tables migration process completed');
    process.exit(0);
  } catch (error) {
    console.error('Error running analytics tables migration:', error);
    process.exit(1);
  }
}

// Run the function
runMigration();
