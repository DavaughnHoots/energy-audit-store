// associate_orphaned_audits.js - Associates orphaned energy audits with users
// This file is imported by server.ts to run on startup and scheduled intervals

import pkg from 'pg';
const { Pool } = pkg;

// Function to associate orphaned audits with users based on email
export async function associateOrphanedAudits() {
  console.log('Starting orphaned audit association...');
  
  // Create a database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  let associated = 0;
  let orphaned = 0;
  
  try {
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // 1. Find orphaned audits (audits with temp_email but no user_id)
      const orphanedQuery = await client.query(`
        SELECT id, temp_email
        FROM energy_audits
        WHERE user_id IS NULL 
        AND temp_email IS NOT NULL
        ORDER BY created_at DESC
      `);
      
      orphaned = orphanedQuery.rows.length;
      console.log(`Found ${orphaned} orphaned audits`);
      
      // 2. Process each orphaned audit
      for (const audit of orphanedQuery.rows) {
        // Find user with matching email
        const userQuery = await client.query(`
          SELECT id FROM users
          WHERE email = $1
          LIMIT 1
        `, [audit.temp_email]);
        
        // If user exists, associate audit with user
        if (userQuery.rows.length > 0) {
          const userId = userQuery.rows[0].id;
          
          await client.query(`
            UPDATE energy_audits
            SET user_id = $1
            WHERE id = $2
          `, [userId, audit.id]);
          
          console.log(`Associated audit ${audit.id} with user ${userId} (${audit.temp_email})`);
          associated++;
        } else {
          console.log(`No matching user found for email: ${audit.temp_email}`);
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log(`Orphaned audit association completed. Associated: ${associated} of ${orphaned}`);
      
      return {
        success: true,
        orphaned,
        associated
      };
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error in orphaned audit association:', error);
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  } finally {
    // Close pool
    await pool.end();
  }
}

// Default export for compatibility
export default { associateOrphanedAudits };
