# Weather Data Filtering Verification Script for PowerShell
#
# This script tests the filtered weather data queries to ensure they fit within Heroku's free tier limits
# 
# Usage:
#   .\verify_filtered_data.ps1
#
# Prerequisites:
#   - Node.js installed
#   - SQLite database created by preprocess_weather_data.py

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js."
    exit 1
}

# Create a temporary JavaScript file for the verification
$tempScriptPath = "$env:TEMP\verify_weather_data.js"

$scriptContent = @"
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Define major cities (same as in upload script)
const MAJOR_CITIES = [
  // Large metro areas (various climate zones)
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'San Francisco', 'Charlotte', 'Indianapolis', 
  'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville',
  'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville',
  'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento',
  
  // Additional cities for climate zone coverage
  'Miami', 'Minneapolis', 'Anchorage', 'Honolulu', 'Burlington', 'Buffalo',
  'Mobile', 'Boise', 'Salt Lake City', 'Pittsburgh', 'St. Louis', 'Portland',
  'Atlanta', 'Omaha', 'Des Moines', 'Cincinnati', 'Kansas City', 'Cleveland'
];

// Recent years to include
const RECENT_YEARS = [2021, 2022];

// Path to SQLite database
const DB_PATH = path.join(process.cwd(), 'processed_weather_data', 'weather_energy_data.db');

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
  console.error(`Error: Database not found at `${DB_PATH}`);
  console.error('Please run the preprocessing script first.');
  process.exit(1);
}

// Open database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(`Error opening database: `${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to SQLite database at `${DB_PATH}`);
});

// Queries to test (same as in upload script)
const QUERIES = [
  {
    name: 'Filtered Locations',
    query: `SELECT * FROM locations WHERE city IN (`${MAJOR_CITIES.map(city => `'`${city}`'`).join(', ')}) LIMIT 200`
  },
  {
    name: 'Filtered Monthly Stats',
    query: `SELECT 
              location_id,
              year,
              month,
              total_heating_degree_days,
              total_cooling_degree_days
            FROM monthly_stats
            WHERE year IN (`${RECENT_YEARS.join(', ')})
            AND location_id IN (
              SELECT location_id FROM locations 
              WHERE city IN (`${MAJOR_CITIES.map(city => `'`${city}`'`).join(', ')})
              LIMIT 200
            )`
  },
  {
    name: 'Filtered Event Stats',
    query: `SELECT 
              location_id,
              event_type,
              count,
              avg_duration,
              avg_severity,
              energy_impact_score
            FROM event_stats
            WHERE location_id IN (
              SELECT location_id FROM locations 
              WHERE city IN (`${MAJOR_CITIES.map(city => `'`${city}`'`).join(', ')})
              LIMIT 200
            )`
  },
  {
    name: 'Seasonal Factors',
    query: `
      WITH seasonal_data AS (
        SELECT 
          location_id,
          month,
          AVG(total_heating_degree_days + total_cooling_degree_days) as combined_degree_days
        FROM 
          monthly_stats
        WHERE
          location_id IN (
            SELECT location_id FROM locations 
            WHERE city IN (`${MAJOR_CITIES.map(city => `'`${city}`'`).join(', ')})
            LIMIT 200
          )
        GROUP BY 
          location_id, month
      ),
      location_avg AS (
        SELECT 
          location_id,
          AVG(combined_degree_days) as avg_combined
        FROM 
          seasonal_data
        GROUP BY 
          location_id
      )
      SELECT 
        s.location_id,
        s.month,
        CASE 
          WHEN l.avg_combined > 0 
          THEN MAX(0.6, MIN(1.8, s.combined_degree_days / l.avg_combined))
          ELSE 1.0 
        END as adjustment_factor
      FROM 
        seasonal_data s
      JOIN 
        location_avg l ON s.location_id = l.location_id
      GROUP BY
        s.location_id, s.month
    `
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
      const rows = await new Promise((resolve, reject) => {
        db.all(query.query, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      console.log(`${query.name}: ${rows.length} rows`);
      totalRows += rows.length;
      
      // Show sample data if available
      if (rows.length > 0) {
        console.log('  Sample: ', JSON.stringify(rows[0]).substring(0, 100) + '...');
      }
    } catch (err) {
      console.error(`Error executing query "` + `${query.name}` + `": `${err.message}`);
    }
  }
  
  console.log('--------------------------------');
  console.log(`Total rows: `${totalRows}`);
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
  
  console.log(`Estimated database size: `${estimatedSizeMB.toFixed(2)}` MB`);
  
  // Close database
  db.close();
}

// Run the verification
verifyDataSize().catch(err => {
  console.error(`Fatal error: `${err.message}`);
  db.close();
  process.exit(1);
});
"@

# Write the script to a temporary file
$scriptContent | Out-File -FilePath $tempScriptPath -Encoding utf8

Write-Host "Checking if sqlite3 module is installed..."
# Check if sqlite3 module is installed, if not install it
$sqlite3Check = npm list sqlite3 2>&1
if ($sqlite3Check -match "npm ERR! missing") {
    Write-Host "Installing sqlite3 module..."
    npm install sqlite3
}

# Run the verification script
Write-Host "Running verification script..."
Write-Host "==============================="
node $tempScriptPath

# Clean up
Remove-Item -Path $tempScriptPath
Write-Host "Verification complete."
