// run_energy_consumption_migration.js - Handles energy consumption database migrations
// This file is imported by server.ts to run migrations on startup

import pkg from 'pg';
const { Pool } = pkg;

// Function to run energy consumption table migrations
export async function runEnergyConsumptionMigration() {
  console.log('Starting energy consumption migration...');
  
  // Create a database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // 1. Check if energy_consumption table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'energy_consumption'
        );
      `);
      
      // 2. Create energy_consumption table if it doesn't exist
      if (!tableExists.rows[0].exists) {
        console.log('Creating energy_consumption table...');
        
        await client.query(`
          CREATE TABLE energy_consumption (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            property_id UUID,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            electricity_kwh DECIMAL(10,2),
            gas_therms DECIMAL(10,2),
            electricity_cost DECIMAL(10,2),
            gas_cost DECIMAL(10,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, property_id, month, year)
          );
        `);
        
        console.log('energy_consumption table created successfully');
      } else {
        console.log('energy_consumption table already exists, skipping creation');
        
        // Check if we need to add any columns to existing table
        const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'energy_consumption' 
          AND column_name = 'property_id';
        `);
        
        if (columnCheck.rows.length === 0) {
          console.log('Adding property_id column to energy_consumption table...');
          await client.query(`
            ALTER TABLE energy_consumption 
            ADD COLUMN property_id UUID;
          `);
          console.log('property_id column added successfully');
        }
      }
      
      // 3. Check if energy_usage_habits table exists
      const habitsTableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'energy_usage_habits'
        );
      `);
      
      // 4. Create energy_usage_habits table if it doesn't exist
      if (!habitsTableExists.rows[0].exists) {
        console.log('Creating energy_usage_habits table...');
        
        await client.query(`
          CREATE TABLE energy_usage_habits (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            property_id UUID,
            heating_hours_per_day INTEGER,
            cooling_hours_per_day INTEGER,
            appliance_usage JSONB,
            lighting_hours_per_day INTEGER,
            occupancy INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, property_id)
          );
        `);
        
        console.log('energy_usage_habits table created successfully');
      } else {
        console.log('energy_usage_habits table already exists, skipping creation');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Energy consumption migration completed successfully');
      
      return { success: true };
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error in energy consumption migration:', error);
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
export default { runEnergyConsumptionMigration };
