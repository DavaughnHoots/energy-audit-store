const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const HEROKU_APP_NAME = 'energy-audit-store';
const DEPLOY_BRANCH = 'deploy-property-settings-rework';
const SOURCE_BRANCH = 'main'; // or whatever your main branch is called

// Files that we expect to modify
const MODIFIED_FILES = [
  'src/services/userProfileService.enhanced.ts',
  'src/components/dashboard2/SimpleDashboardLayout.tsx',
  'src/components/dashboard2/index.ts',
  'src/components/dashboard2/PropertySettingsTab.tsx', // New file
  'src/pages/UserSettingsPage.tsx',
  'src/pages/UserDashboardPage.tsx',
  'src/pages/NewUserDashboardPage.tsx',
  'src/App.tsx',
];

// Logging utilities
const log = {
  info: (msg) => console.log('\x1b[36m%s\x1b[0m', `[INFO] ${msg}`),
  success: (msg) => console.log('\x1b[32m%s\x1b[0m', `[SUCCESS] ${msg}`),
  error: (msg) => console.log('\x1b[31m%s\x1b[0m', `[ERROR] ${msg}`),
  warning: (msg) => console.log('\x1b[33m%s\x1b[0m', `[WARNING] ${msg}`),
};

// Function to execute commands and handle errors
function executeCommand(command, silent = false) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    log.error(`Command failed: ${command}`);
    log.error(error.message);
    process.exit(1);
  }
}

// Main deployment function
async function deploy() {
  log.info('Starting deployment of Property Settings Rework...');
  
  // Check if we're on the right branch
  const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD', true).trim();
  if (currentBranch !== SOURCE_BRANCH) {
    log.warning(`Currently on branch ${currentBranch}, not ${SOURCE_BRANCH}`);
    log.warning('Please make sure all your changes are committed to the main branch before proceeding.');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise((resolve) => {
      readline.question('Continue anyway? (y/n): ', (answer) => {
        if (answer.toLowerCase() !== 'y') {
          log.info('Deployment canceled.');
          process.exit(0);
        }
        readline.close();
        resolve();
      });
    });
  }

  // Verify all expected files exist (except new files)
  for (const file of MODIFIED_FILES) {
    // Skip checking for new files
    if (file.includes('PropertySettingsTab.tsx')) continue;
    
    if (!fs.existsSync(file)) {
      log.error(`Expected file ${file} not found. Deployment canceled.`);
      process.exit(1);
    }
  }

  // Create and checkout deployment branch
  log.info(`Creating deployment branch: ${DEPLOY_BRANCH}`);
  executeCommand(`git checkout -b ${DEPLOY_BRANCH}`);
  
  // Add all changes
  log.info('Adding changes...');
  executeCommand('git add .');
  
  // Commit changes
  log.info('Committing changes...');
  executeCommand('git commit -m "Deploy: Property Settings Rework"');
  
  // Push to Heroku
  log.info(`Deploying to Heroku app: ${HEROKU_APP_NAME}...`);
  executeCommand(`git push https://git.heroku.com/${HEROKU_APP_NAME}.git ${DEPLOY_BRANCH}:main --force`);
  
  // Return to the original branch
  log.info(`Returning to branch: ${SOURCE_BRANCH}`);
  executeCommand(`git checkout ${SOURCE_BRANCH}`);
  
  // Optional: remove the deployment branch
  log.info(`Removing deployment branch: ${DEPLOY_BRANCH}`);
  executeCommand(`git branch -D ${DEPLOY_BRANCH}`);
  
  log.success('Deployment completed successfully!');
  log.info('Changes deployed:');
  log.info('1. Auto-populated Property Settings with Audit defaults');
  log.info('2. Added Property Settings tab to Dashboard');
  log.info('3. Updated navigation and button labels');
  log.info('4. Modified Settings Page to show only General tab');
  
  log.info('\nMonitor the application for any issues.');
  log.info('Verify that:');
  log.info('- Property settings are auto-populated for new users');
  log.info('- Dashboard shows the new Property Settings tab');
  log.info('- Navigation between settings pages works correctly');
}

// Execute the deployment
deploy().catch(error => {
  log.error('Deployment failed:');
  log.error(error.message);
  process.exit(1);
});
