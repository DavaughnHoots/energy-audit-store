// scripts/heroku_deploy_dashboard_updates.js
// Deploy the dashboard updates and analytics tracking fixes to Heroku

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
async function deployDashboardUpdates() {
  try {
    console.log('Starting dashboard updates deployment to Heroku...');

    // Ensure we're on the main branch
    executeCommand('git checkout main');

    // Files we've modified
    const modifiedFiles = [
      'src/context/AnalyticsContext.tsx',
      'src/pages/AdminDashboardPage.tsx',
      'backend/src/routes/analytics.ts',
      'backend/src/routes/direct-admin.ts',
      'backend/src/server.ts',
      'dashboard-redesign-implementation-plan.md'
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
    executeCommand('git commit -m "Redesign admin dashboard UI and stop dashboard analytics tracking"');

    // Deploy to Heroku
    console.log('Deploying to Heroku...');
    executeCommand('git push heroku HEAD:main');

    console.log('Dashboard updates successfully deployed to Heroku!');
    console.log('Key changes:');
    console.log('1. Analytics events from dashboard area are now blocked both in frontend and backend');
    console.log('2. The admin dashboard UI has been updated to match the new design');
    console.log('3. Date range filtering has been added to the dashboard');
  } catch (error) {
    console.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the deployment
deployDashboardUpdates();
