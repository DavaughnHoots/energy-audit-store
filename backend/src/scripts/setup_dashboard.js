#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeSQL(filePath, description) {
  console.log(`\nExecuting ${description}...`);
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    await pool.query(sql);
    console.log(`✓ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`✗ Error executing ${description}:`);
    console.error(error.message);
    return false;
  }
}

async function setupDashboard() {
  console.log('Setting up dashboard database...\n');

  try {
    // Create tables
    const tablesResult = await executeSQL(
      path.join(__dirname, '../migrations/create_dashboard_tables.sql'),
      'Creating dashboard tables'
    );

    if (!tablesResult) {
      throw new Error('Failed to create tables');
    }

    // Seed test data
    const seedResult = await executeSQL(
      path.join(__dirname, './seed_dashboard_data.sql'),
      'Seeding dashboard data'
    );

    if (!seedResult) {
      throw new Error('Failed to seed data');
    }

    console.log('\n✓ Dashboard setup completed successfully');

  } catch (error) {
    console.error('\n✗ Dashboard setup failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDashboard().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
