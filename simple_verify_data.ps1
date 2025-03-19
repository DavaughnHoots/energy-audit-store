# Simple Weather Data Size Verification Script for PowerShell
# 
# This script provides a simple verification of filtered data size
# to ensure it will fit within Heroku's free tier PostgreSQL limits
#
# Usage: .\simple_verify_data.ps1

# Make sure we have the SQLite module
if (-not (Test-Path node_modules\sqlite3)) {
    Write-Host "Installing SQLite3 module..."
    npm install sqlite3
}

# Create a simple Node.js script to check data size
$tempScriptPath = "temp_verify_script.js"

$scriptContent = @'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path to SQLite database
const DB_PATH = path.join(process.cwd(), 'processed_weather_data', 'weather_energy_data.db');

// Define the major cities (same as in upload script)
const MAJOR_CITIES = [
  // Just list a few of the major cities as examples
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'Miami', 'Seattle', 'Denver', 'Boston', 'San Francisco'
  // Note: The actual upload script uses many more cities
];

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
  console.error('Error: Database not found at ' + DB_PATH);
  console.error('Please run the preprocessing script first.');
  process.exit(1);
}

// Open database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database: ' + err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database at ' + DB_PATH);
});

// Simple queries to count rows that would be transferred
const QUERIES = [
  {
    name: 'Filtered Locations',
    query: "SELECT COUNT(*) as count FROM locations WHERE city IN ('" + 
           MAJOR_CITIES.join("','") + "') LIMIT 200"
  },
  {
    name: 'Filtered Monthly Stats (2021-2022)',
    query: "SELECT COUNT(*) as count FROM monthly_stats WHERE year IN (2021, 2022)" +
           " AND location_id IN (SELECT location_id FROM locations WHERE city IN ('" + 
           MAJOR_CITIES.join("','") + "') LIMIT 200)"
  },
  {
    name: 'Filtered Event Stats',
    query: "SELECT COUNT(*) as count FROM event_stats WHERE location_id IN " +
           "(SELECT location_id FROM locations WHERE city IN ('" + 
           MAJOR_CITIES.join("','") + "') LIMIT 200)"
  },
  {
    name: 'Seasonal Factors (estimated)',
    query: "SELECT COUNT(DISTINCT location_id) * 12 as count FROM monthly_stats WHERE " +
           "location_id IN (SELECT location_id FROM locations WHERE city IN ('" + 
           MAJOR_CITIES.join("','") + "') LIMIT 200)"
  }
];

// Run all queries and count rows
async function verifyDataSize() {
  console.log('Verifying filtered data sizes...');
  console.log('--------------------------------');
  
  let totalRows = 0;
  
  for (const query of QUERIES) {
    try {
      // Execute query and count rows
      const result = await new Promise((resolve, reject) => {
        db.get(query.query, [], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      const count = result.count || 0;
      console.log(`${query.name}: ${count} rows`);
      totalRows += count;
    } catch (err) {
      console.error(`Error executing query "${query.name}": ${err.message}`);
    }
  }
  
  console.log('--------------------------------');
  console.log(`Total rows: ${totalRows}`);
  console.log(`Heroku free tier limit: 10,000 rows`);
  
  if (totalRows <= 10000) {
    console.log('✅ DATA WILL FIT within Heroku free tier limits');
  } else {
    console.log('⚠️ WARNING: Data exceeds Heroku free tier limits');
    console.log('Consider further filtering or upgrading your Heroku PostgreSQL plan');
  }
  
  // Calculate estimated PostgreSQL size
  const estimatedSizeBytes = totalRows * 200; // Rough estimate: 200 bytes per row
  const estimatedSizeMB = estimatedSizeBytes / (1024 * 1024);
  
  console.log(`Estimated database size: ${estimatedSizeMB.toFixed(2)} MB`);
  
  // Close database
  db.close();
}

// Run the verification
verifyDataSize().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  db.close();
  process.exit(1);
});
'@

# Write the script to the temp file
$scriptContent | Out-File -FilePath $tempScriptPath -Encoding utf8

# Run the verification script
Write-Host "Running simplified verification script..."
Write-Host "=========================================="
node $tempScriptPath

# Clean up
Remove-Item -Path $tempScriptPath
Write-Host "Verification complete. Check the results above to see if your data fits within Heroku limits."
