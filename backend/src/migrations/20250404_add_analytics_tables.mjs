/**
 * This migration adds the necessary analytics tables 
 * if they don't already exist in the database.
 * (ES Module version)
 */

export default {
  up: async (queryInterface, Sequelize) => {
    // Check if analytics_events table exists
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
    
    // Create indexes for performance
    if (!existingTables.includes('analytics_events')) {
      await queryInterface.addIndex('analytics_events', ['session_id']);
      await queryInterface.addIndex('analytics_events', ['user_id']);
      await queryInterface.addIndex('analytics_events', ['event_type']);
      await queryInterface.addIndex('analytics_events', ['area']);
      await queryInterface.addIndex('analytics_events', ['timestamp']);
    }
    
    if (!existingTables.includes('analytics_sessions')) {
      await queryInterface.addIndex('analytics_sessions', ['user_id']);
      await queryInterface.addIndex('analytics_sessions', ['start_time']);
      await queryInterface.addIndex('analytics_sessions', ['is_active']);
    }
    
    if (!existingTables.includes('analytics_consent')) {
      await queryInterface.addIndex('analytics_consent', ['user_id']);
      await queryInterface.addIndex('analytics_consent', ['consent_date']);
    }
    
    console.log('Analytics tables migration completed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    // Carefully drop tables in reverse order to handle foreign key constraints
    await queryInterface.dropTable('analytics_events', { cascade: true });
    await queryInterface.dropTable('analytics_sessions', { cascade: true });
    await queryInterface.dropTable('analytics_consent', { cascade: true });
    await queryInterface.dropTable('pilot_tokens', { cascade: true });
  }
};
