// scripts/heroku_deploy_analytics_tracking_debug.js
// Deploy the analytics tracking debug branch to Heroku for testing

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
async function deployAnalyticsTrackingDebug() {
  try {
    console.log('Starting deployment of analytics-tracking-debug branch to Heroku...');
    console.log('WARNING: This will temporarily override the main branch on Heroku!');
    console.log('');
    
    // Ensure we're on the analytics-tracking-debug branch
    const currentBranch = executeCommand('git branch --show-current').trim();
    
    if (currentBranch !== 'analytics-tracking-debug') {
      console.error(`Error: Currently on branch '${currentBranch}' instead of 'analytics-tracking-debug'`);
      console.log('Please switch to the analytics-tracking-debug branch first with:');
      console.log('git checkout analytics-tracking-debug');
      process.exit(1);
    }
    
    // Make sure all changes are committed
    const status = executeCommand('git status --porcelain');
    
    if (status.trim() !== '') {
      console.error('Error: You have uncommitted changes. Please commit or stash them first.');
      process.exit(1);
    }
    
    // Force push the debug branch to Heroku's main branch
    console.log('Force pushing analytics-tracking-debug branch to Heroku main...');
    executeCommand('git push heroku analytics-tracking-debug:main -f');
    
    console.log('\nDeployment successful!');
    console.log('\nNext steps:');
    console.log('1. Visit the website and check the browser console for detailed analytics logging');
    console.log('2. Navigate to /analytics-debug to use the debugging tools');
    console.log('3. Run run-heroku-check-analytics-events.bat to check database events');
    console.log('\nTo revert back to the regular main branch:');
    console.log('git checkout main');
    console.log('git push heroku main:main -f');
  } catch (error) {
    console.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the deployment
deployAnalyticsTrackingDebug();
