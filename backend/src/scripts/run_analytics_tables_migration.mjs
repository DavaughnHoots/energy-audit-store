/**
 * Script to run the analytics tables migration (ES Module version)
 * 
 * This script specifically runs the 20250404_add_analytics_tables.js migration
 * to ensure the analytics tables are properly created in the database.
 */

// No dotenv import - use process.env directly (Heroku environment variables are already set)
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('Starting analytics tables migration...');
  
  try {
    console.log('Using database URL:', process.env.DATABASE_URL ? 'From environment variable (value hidden)' : 'Default local connection string');
    
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
    const migrationPath = path.join(__dirname, '../migrations/20250404_add_analytics_tables.mjs');
    console.log('Loading migration from:', migrationPath);
    
    try {
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
    } catch (importError) {
      console.error('Error importing migration:', importError);
      console.log('Attempting manual table creation...');
      
      // Fallback to manual table creation
      await createTables(sequelize.getQueryInterface(), Sequelize);
    }

    console.log('Analytics tables migration process completed');
    process.exit(0);
  } catch (error) {
    console.error('Error running analytics tables migration:', error);
    process.exit(1);
  }
}

// Fallback function to create tables manually if the import fails
async function createTables(queryInterface, Sequelize) {
  console.log('Creating tables manually...');

  // Check if tables exist
  const tablesResult = await queryInterface.sequelize.query(
    `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('analytics_events', 'analytics_sessions', 'analytics_consent', 'pilot_tokens')`
  );
  
  const existingTables = tablesResult[0].map(row => row.table_name);
  console.log('Existing analytics tables:', existingTables);
  
  // Create analytics_sessions table first (because of foreign key constraints)
  if (!existingTables.includes('analytics_sessions')) {
    console.log('Creating analytics_sessions table...');
    await queryInterface.createTable('analytics_sessions', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      events_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  }
  
  // Create analytics_events table if it doesn't exist
  if (!existingTables.includes('analytics_events')) {
    console.log('Creating analytics_events table...');
    await queryInterface.createTable('analytics_events', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      session_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'analytics_sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      area: {
        type: Sequelize.STRING,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  }
  
  // Create analytics_consent table if it doesn't exist
  if (!existingTables.includes('analytics_consent')) {
    console.log('Creating analytics_consent table...');
    await queryInterface.createTable('analytics_consent', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('granted', 'denied', 'withdrawn'),
        allowNull: false
      },
      consent_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      consent_version: {
        type: Sequelize.STRING,
        allowNull: false
      },
      data_usage_accepted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  }
  
  // Create pilot_tokens table if it doesn't exist
  if (!existingTables.includes('pilot_tokens')) {
    console.log('Creating pilot_tokens table...');
    await queryInterface.createTable('pilot_tokens', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      participant_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  }
  
  console.log('Tables created successfully');
}

// Run the function
runMigration();
