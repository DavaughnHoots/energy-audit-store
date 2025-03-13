// Script to run energy consumption records migration
import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appLogger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Function to run the energy consumption records migration
 */
export async function runEnergyConsumptionMigration() {
  try {
    appLogger.info('Starting energy consumption records migration');
    
    // Path to the migration file
    const migrationPath = path.join(__dirname, '../migrations/20250314_01_add_energy_consumption_records.sql');
    
    // Check if the migration file exists
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    // Read the migration file
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Check if migration has already been run by looking for the table
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'energy_consumption_records'
      ) as exists
    `;
    
    const tableExistsResult = await pool.query(tableExistsQuery);
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      appLogger.info('Energy consumption records table already exists, skipping migration');
      return { success: true, message: 'Table already exists, migration skipped' };
    }
    
    // Run the migration
    await pool.query(migrationSQL);
    
    appLogger.info('Energy consumption records migration completed successfully');
    
    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    appLogger.error('Error running energy consumption records migration:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    throw error;
  }
}

// Run the migration if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runEnergyConsumptionMigration()
    .then((result) => {
      console.log('Migration result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
