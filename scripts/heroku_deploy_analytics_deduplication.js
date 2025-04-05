// scripts/heroku_deploy_analytics_deduplication.js
// Deploy the analytics deduplication fixes to Heroku

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to execute shell commands
function executeCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    throw error;
  }
}

// Main function
async function deployDeduplicationFix() {
  try {
    console.log('Starting analytics deduplication fix deployment to Heroku...');

    // Ensure we're on the main branch
    executeCommand('git checkout main');

    // Files we've modified
    const modifiedFiles = [
      'src/context/AnalyticsContext.tsx',
      'src/hooks/analytics/usePageTracking.ts',
      'backend/src/routes/analytics.ts'
    ];

    // Create backup of the original files
    console.log('Creating backup of original files...');
    
    modifiedFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.copyFileSync(
          fullPath,
          path.join(process.cwd(), `${filePath}.backup`)
        );
      }
    });
    
    // Git operations
    console.log('Adding modified files...');
    executeCommand(`git add ${modifiedFiles.join(' ')}`);
    
    console.log('Committing changes...');
    executeCommand('git commit -m "Fix analytics duplicate events with frontend and backend deduplication"');

    // Deploy to Heroku
    console.log('Deploying to Heroku...');
    executeCommand('git push heroku HEAD:main');

    console.log('Analytics deduplication fix successfully deployed to Heroku!');
    console.log('The app should now handle analytics events correctly without duplicates.');
  } catch (error) {
    console.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the deployment
deployDeduplicationFix();
