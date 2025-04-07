/* 
 * Dashboard Report Button Deployment Script
 * 
 * This script deploys the blue "View Full Energy Report" button added to the bottom
 * of the dashboard2 page.
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting dashboard report button deployment...');

// Function to safely execute commands
function runCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf-8' });
    console.log('Command completed successfully');
    return output;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    throw error;
  }
}

// Create new branch for the changes
try {
  // Check if we're already on the dashboard-report-button branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  
  if (currentBranch !== 'dashboard-report-button') {
    console.log('Creating and checking out dashboard-report-button branch...');
    
    // Check if the branch exists
    const branches = execSync('git branch', { encoding: 'utf-8' });
    
    if (branches.includes('dashboard-report-button')) {
      runCommand('git checkout dashboard-report-button');
    } else {
      runCommand('git checkout -b dashboard-report-button');
    }
  } else {
    console.log('Already on dashboard-report-button branch');
  }
} catch (error) {
  console.error('Error handling git branch:', error);
  process.exit(1);
}

// Commit the changes to the new branch
try {
  console.log('Committing changes...');
  runCommand('git add src/pages/NewUserDashboardPage.tsx');
  runCommand('git commit -m "Add blue report button to dashboard"');
} catch (error) {
  console.error('Error committing changes:', error);
  process.exit(1);
}

// Push to repository
try {
  console.log('Pushing to repository...');
  runCommand('git push origin dashboard-report-button');
} catch (error) {
  console.error('Error pushing to repository:', error);
  console.log('You may need to push manually with: git push origin dashboard-report-button');
}

// Deploy to Heroku
try {
  console.log('Deploying to Heroku...');
  runCommand('git push heroku dashboard-report-button:main');
} catch (error) {
  console.error('Error deploying to Heroku:', error);
  console.log('You may need to deploy manually with: git push heroku dashboard-report-button:main');
}

console.log('Dashboard report button deployment completed successfully');
