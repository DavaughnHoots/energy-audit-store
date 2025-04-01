// Migration: Add Recommendation Updates Table and View
import { pool } from '../config/database.js';
import { appLogger } from '../utils/logger.js';

export async function runMigration() {
  const client = await pool.connect();
  
  try {
    appLogger.info('Starting recommendation updates migration');
    
    await client.query('BEGIN');
    
    // Create recommendation_updates table to store user-specific updates
    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendation_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recommendation_id UUID NOT NULL REFERENCES audit_recommendations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20),
        priority VARCHAR(20),
        actual_savings DECIMAL(10, 2),
        implementation_date DATE,
        implementation_cost DECIMAL(10, 2),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (recommendation_id, user_id)
      );
    `);
    
    appLogger.info('Created recommendation_updates table');
    
    // Create index for faster querying
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recommendation_updates_recommendation_id 
      ON recommendation_updates(recommendation_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recommendation_updates_user_id 
      ON recommendation_updates(user_id);
    `);
    
    // Create view that joins recommendations with their updates
    await client.query(`
      CREATE OR REPLACE VIEW recommendation_with_updates AS
      SELECT 
        ar.id,
        ar.audit_id,
        ar.title,
        ar.description,
        ar.type,
        ar.category,
        ar.estimated_savings,
        COALESCE(ru.actual_savings, ar.actual_savings) AS actual_savings,
        COALESCE(ru.status, ar.status) AS status,
        COALESCE(ru.priority, ar.priority) AS priority,
        COALESCE(ru.implementation_date, ar.implementation_date) AS implementation_date,
        COALESCE(ru.implementation_cost, ar.implementation_cost) AS implementation_cost,
        ar.payback_period,
        ar.roi,
        ar.created_at,
        COALESCE(ru.updated_at, ar.updated_at) AS updated_at,
        ru.user_id
      FROM 
        audit_recommendations ar
      LEFT JOIN 
        recommendation_updates ru ON ar.id = ru.recommendation_id
      WHERE
        ar.deleted_at IS NULL;
    `);
    
    appLogger.info('Created recommendation_with_updates view');
    
    await client.query('COMMIT');
    
    appLogger.info('Recommendation updates migration completed successfully');
    
    return { success: true, message: 'Recommendation updates migration completed' };
  } catch (error) {
    await client.query('ROLLBACK');
    
    appLogger.error('Error in recommendation updates migration', { 
      error: error.message, 
      stack: error.stack 
    });
    
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this file is executed directly
if (process.argv[1].endsWith('20250401_add_recommendation_updates.js')) {
  runMigration()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
