/**
 * Script to run the analytics tables migration
 * 
 * This script specifically runs the 20250404_add_analytics_tables.js migration
 * to ensure the analytics tables are properly created in the database.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');

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

    // Configure umzug to use our sequelize instance
    const umzug = new Umzug({
      migrations: { 
        glob: path.join(__dirname, '../migrations/20250404_add_analytics_tables.js'),
        resolve: ({ name, path, context }) => {
          const migration = require(path);
          return {
            name,
            up: async () => migration.up(context, Sequelize),
            down: async () => migration.down(context, Sequelize),
          };
        },
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    });

    // Execute the migration
    console.log('Running analytics tables migration...');
    const migrations = await umzug.up();
    
    if (migrations.length === 0) {
      console.log('No new migrations were executed. Tables might already exist.');
    } else {
      console.log('Successfully executed migrations:', migrations.map(m => m.name).join(', '));
    }

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
