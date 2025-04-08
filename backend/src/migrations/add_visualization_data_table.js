const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'add_visualization_data_table.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting visualization data table migration');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Execute the migration SQL
    console.log('Executing migration SQL');
    await client.query(sqlContent);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Migration failed', error);
    throw error;
  } finally {
    // Release client
    client.release();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Visualization data table migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
