/**
 * Deployment script for analytics fix
 * Adds direct analytics event tracking functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const APP_NAME = 'energy-audit-store';
const SOURCE_DIR = path.join(__dirname, '..');
const TEMP_DIR = path.join(__dirname, '../temp_deploy');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Files to update
const filesToUpdate = [
  {
    source: path.join(SOURCE_DIR, 'backend/src/services/AnalyticsService.ts'),
    target: path.join(TEMP_DIR, 'AnalyticsService.ts'),
    remotePath: 'backend/src/services/analyticsService.js'
  },
  {
    source: path.join(SOURCE_DIR, 'backend/src/routes/analytics.ts'),
    target: path.join(TEMP_DIR, 'analytics.ts'),
    remotePath: 'backend/src/routes/analytics.js'
  }
];

// Copy files to temp directory
filesToUpdate.forEach(file => {
  console.log(`Copying ${file.source} to ${file.target}`);
  fs.copyFileSync(file.source, file.target);
});

// Process each file
filesToUpdate.forEach(file => {
  console.log(`\nProcessing ${file.source}`);
  
  // Deploy each file to Heroku
  try {
    // Use cat to deploy file content directly to Heroku
    const command = `heroku run "cat > ${file.remotePath}" --app ${APP_NAME} < "${file.target}"`;
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log(`Successfully deployed ${file.remotePath}`);
  } catch (error) {
    console.error(`Error deploying ${file.remotePath}:`, error.message);
    process.exit(1);
  }
});

// Restart the application
try {
  console.log('\nRestarting the application...');
  execSync(`heroku restart --app ${APP_NAME}`, { stdio: 'inherit' });
  console.log('Application restarted successfully.');
} catch (error) {
  console.error('Error restarting application:', error.message);
  process.exit(1);
}

console.log('\nAnalytics fix deployment completed successfully!');
console.log('Direct analytics event tracking should now be operational.');
