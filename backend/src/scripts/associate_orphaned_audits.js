// Script to associate orphaned audits with users
import { pool } from '../config/database.js';
import { appLogger } from '../utils/logger.js';

/**
 * Associates orphaned audits with users based on client ID
 * This script finds audits that have a client ID but no user ID,
 * and associates them with users who have used the same client ID
 */
async function associateOrphanedAudits() {
  const client = await pool.connect();
  try {
    appLogger.info('Starting orphaned audit association process');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Find orphaned audits with client_id
    const orphanedAuditsResult = await client.query(`
      SELECT ea.id, ea.client_id
      FROM energy_audits ea
      WHERE ea.user_id IS NULL AND ea.client_id IS NOT NULL
    `);
    
    const orphanedAudits = orphanedAuditsResult.rows;
    appLogger.info(`Found ${orphanedAudits.length} orphaned audits with client_id`);
    
    // For each orphaned audit, try to find a user who has used the same client_id
    let associatedCount = 0;
    for (const audit of orphanedAudits) {
      // Look for a user who has used this client_id
      const userResult = await client.query(`
        SELECT DISTINCT ea.user_id
        FROM energy_audits ea
        WHERE ea.client_id = $1 AND ea.user_id IS NOT NULL
        LIMIT 1
      `, [audit.client_id]);
      
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].user_id;
        
        // Associate the orphaned audit with this user
        await client.query(`
          UPDATE energy_audits
          SET user_id = $1
          WHERE id = $2
        `, [userId, audit.id]);
        
        associatedCount++;
        appLogger.info(`Associated audit ${audit.id} with user ${userId}`);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    appLogger.info(`Successfully associated ${associatedCount} orphaned audits with users`);
    
    // Update dashboard stats for affected users
    if (associatedCount > 0) {
      appLogger.info('Refreshing dashboard stats for affected users');
      await client.query(`
        DELETE FROM dashboard_stats
        WHERE user_id IN (
          SELECT DISTINCT user_id
          FROM energy_audits
          WHERE id IN (${orphanedAudits.map(a => `'${a.id}'`).join(',')})
        )
      `);
    }
    
    return { processed: orphanedAudits.length, associated: associatedCount };
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error('Error associating orphaned audits:', { error });
    throw error;
  } finally {
    client.release();
  }
}

// If this script is run directly
if (process.argv[1].endsWith('associate_orphaned_audits.js')) {
  associateOrphanedAudits()
    .then(result => {
      console.log(`Processed ${result.processed} orphaned audits, associated ${result.associated}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { associateOrphanedAudits };
