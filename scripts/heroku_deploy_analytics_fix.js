// scripts/heroku_deploy_analytics_fix.js
// Deploy the analytics route fix to Heroku

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
async function deployAnalyticsFix() {
  try {
    console.log('Starting analytics fix deployment to Heroku...');

    // Ensure we're on the main branch
    executeCommand('git checkout main');

    // Create a backup of the original files
    console.log('Creating backup of original files...');
    
    const analyticsRoutePath = path.join(process.cwd(), 'backend/src/routes/analytics.ts');
    const serverPath = path.join(process.cwd(), 'backend/src/server.ts');
    
    if (fs.existsSync(analyticsRoutePath)) {
      fs.copyFileSync(
        analyticsRoutePath,
        path.join(process.cwd(), 'backend/src/routes/analytics.original.ts')
      );
    }
    
    // Check that all necessary files exist
    if (!fs.existsSync(path.join(process.cwd(), 'backend/src/services/AnalyticsService.enhanced.ts'))) {
      throw new Error('AnalyticsService.enhanced.ts file not found. Aborting deployment.');
    }

    console.log('Verifying analytics routes exist...');
    if (!fs.existsSync(analyticsRoutePath)) {
      throw new Error('analytics.ts route file not found. Aborting deployment.');
    }

    // Git operations
    console.log('Committing changes...');
    executeCommand('git add backend/src/routes/analytics.ts backend/src/server.ts');
    executeCommand('git commit -m "Fix analytics routes for frontend event tracking"');

    // Deploy to Heroku
    console.log('Deploying to Heroku...');
    executeCommand('git push heroku HEAD:main');

    console.log('Analytics fix successfully deployed to Heroku!');
    console.log('Please verify the routes are now working with the frontend.');
  } catch (error) {
    console.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the deployment
deployAnalyticsFix();
