const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Log with timestamp
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

// Execute command and log output
function execute(command, options = {}) {
  log(`Executing: ${command}`, colors.cyan);
  try {
    const output = execSync(command, {
      stdio: 'inherit',
      ...options,
    });
    return output;
  } catch (error) {
    log(`Error executing command: ${command}`, colors.red);
    log(error.message, colors.red);
    throw error;
  }
}

// Main deployment function
async function deploy() {
  try {
    // 1. Create a new git branch for the deployment
    const branchName = `property-settings-windows-integration-${Date.now()}`;
    log(`Creating new branch: ${branchName}`, colors.green);
    execute(`git checkout -b ${branchName}`);

    // 2. Add all changes to git
    log('Adding changes to git', colors.green);
    execute('git add .');

    // 3. Commit changes
    log('Committing changes', colors.green);
    execute('git commit -m "Integrate WindowManagementSection with PropertySettingsTab and remove window properties from HomeConditionsSection"');

    // 4. Push to GitHub
    log('Pushing to GitHub', colors.blue);
    execute(`git push -u origin ${branchName}`);

    // 5. Deploy to Heroku
    log('Deploying to Heroku', colors.magenta);
    execute('git push heroku HEAD:main');

    // 6. Log successful deployment
    log('🚀 Deployment completed successfully!', colors.green);
    log(`Changes have been pushed to GitHub branch: ${branchName}`, colors.green);
    log('Window management integration changes are now live on Heroku', colors.green);

    // 7. Switch back to main branch
    log('Switching back to main branch', colors.yellow);
    execute('git checkout main');

  } catch (error) {
    log('Deployment failed!', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

// Run the deployment
deploy();
