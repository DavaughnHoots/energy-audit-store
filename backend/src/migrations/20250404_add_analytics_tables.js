// Migration script to add analytics tables

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create admin_config table
    await queryInterface.createTable('admin_config', {
      key: {
        type: Sequelize.STRING(50),
        primaryKey: true
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, { timestamps: false });

    // Add admin password if it doesn't exist
    await queryInterface.sequelize.query(`
      INSERT INTO admin_config (key, value)
      VALUES ('admin_password', 'PilotStudy2025!')
      ON CONFLICT (key) DO NOTHING;
    `);
    
    // Create analytics_events table
    await queryInterface.createTable('analytics_events', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      event_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      area: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    }, { timestamps: false });

    // Create indexes for analytics_events
    await queryInterface.addIndex('analytics_events', ['session_id'], {
      name: 'idx_analytics_events_session_id'
    });
    await queryInterface.addIndex('analytics_events', ['user_id'], {
      name: 'idx_analytics_events_user_id'
    });
    await queryInterface.addIndex('analytics_events', ['event_type'], {
      name: 'idx_analytics_events_event_type'
    });
    await queryInterface.addIndex('analytics_events', ['area'], {
      name: 'idx_analytics_events_area'
    });
    await queryInterface.addIndex('analytics_events', ['timestamp'], {
      name: 'idx_analytics_events_timestamp'
    });

    // Create analytics_sessions table
    await queryInterface.createTable('analytics_sessions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      device_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      screen_size: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      referrer: {
        type: Sequelize.STRING(255),
        allowNull: true
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
    }, { timestamps: false });

    // Create indexes for analytics_sessions
    await queryInterface.addIndex('analytics_sessions', ['user_id'], {
      name: 'idx_analytics_sessions_user_id'
    });
    await queryInterface.addIndex('analytics_sessions', ['start_time'], {
      name: 'idx_analytics_sessions_start_time'
    });
    await queryInterface.addIndex('analytics_sessions', ['is_active'], {
      name: 'idx_analytics_sessions_is_active'
    });

    // Create analytics_consent table
    await queryInterface.createTable('analytics_consent', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      consent_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      consent_version: {
        type: Sequelize.STRING(20),
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
    }, { timestamps: false });

    // Create indexes for analytics_consent
    await queryInterface.addIndex('analytics_consent', ['user_id'], {
      name: 'idx_analytics_consent_user_id'
    });
    await queryInterface.addIndex('analytics_consent', ['status'], {
      name: 'idx_analytics_consent_status'
    });

    // Create analytics_feature_metrics table
    await queryInterface.createTable('analytics_feature_metrics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      feature_id: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      feature_category: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      usage_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      unique_users: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      last_used: {
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
    }, { timestamps: false });

    // Create index for analytics_feature_metrics
    await queryInterface.addIndex('analytics_feature_metrics', ['feature_id'], {
      name: 'idx_analytics_feature_metrics_feature_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order to avoid foreign key constraints
    await queryInterface.dropTable('analytics_feature_metrics');
    await queryInterface.dropTable('analytics_consent');
    await queryInterface.dropTable('analytics_sessions');
    await queryInterface.dropTable('analytics_events');
    await queryInterface.dropTable('admin_config');
  }
};
