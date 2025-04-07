/* 
 * Dashboard Redirect Deployment Script
 * 
 * This script deploys the changes that redirect the old dashboard URL to the new dashboard.
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting dashboard redirect deployment...');

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
  // Check if we're already on the dashboard-redirect branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  
  if (currentBranch !== 'dashboard-redirect') {
    console.log('Creating and checking out dashboard-redirect branch...');
    
    // Check if the branch exists
    const branches = execSync('git branch', { encoding: 'utf-8' });
    
    if (branches.includes('dashboard-redirect')) {
      runCommand('git checkout dashboard-redirect');
    } else {
      runCommand('git checkout -b dashboard-redirect');
    }
  } else {
    console.log('Already on dashboard-redirect branch');
  }
} catch (error) {
  console.error('Error handling git branch:', error);
  process.exit(1);
}

// Commit the changes to the new branch
try {
  console.log('Committing changes...');
  runCommand('git add src/App.tsx');
  runCommand('git commit -m "Redirect /dashboard to /dashboard2"');
} catch (error) {
  console.error('Error committing changes:', error);
  process.exit(1);
}

// Push to repository
try {
  console.log('Pushing to repository...');
  runCommand('git push origin dashboard-redirect');
} catch (error) {
  console.error('Error pushing to repository:', error);
  console.log('You may need to push manually with: git push origin dashboard-redirect');
}

// Deploy to Heroku
try {
  console.log('Deploying to Heroku...');
  runCommand('git push heroku dashboard-redirect:main');
} catch (error) {
  console.error('Error deploying to Heroku:', error);
  console.log('You may need to deploy manually with: git push heroku dashboard-redirect:main');
}

console.log('Dashboard redirect deployment completed successfully');
