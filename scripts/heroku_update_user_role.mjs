// Self-contained script to update a user's role to admin in the database
// Uses ESM format and direct PostgreSQL connections

import pg from 'pg';
const { Pool } = pg;

const userId = '51324b2b-39d6-486d-875b-04d0f103c49a'; // The user ID from the logs

async function updateUserRole() {
  let pool;
  try {
    console.log('Heroku script: Updating user role to admin');
    
    // Create a pool that will use the DATABASE_URL environment variable by default
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Heroku PostgreSQL
      }
    });
    
    // Verify that the user exists
    console.log('Checking if user exists...');
    const userQuery = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (userQuery.rows.length === 0) {
      console.error(`User with ID ${userId} not found`);
      return;
    }
    
    const user = userQuery.rows[0];
    console.log(`Found user: ${user.email} with current role: ${user.role}`);
    
    // Update the user's role to admin
    console.log('Updating user role to admin...');
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      ['admin', userId]
    );
    
    if (result.rows.length > 0) {
      console.log(`Successfully updated user ${result.rows[0].email} to role: ${result.rows[0].role}`);
    } else {
      console.error('Update failed');
    }
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    // Close the connection
    if (pool) {
      await pool.end();
      console.log('Database connection closed');
    }
  }
}

// Run the function
updateUserRole().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
