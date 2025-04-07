/**
 * Heroku deployment script for dashboard population fix
 * This script deploys the changes that populate the dashboard overview sections:
 * - Energy Analysis section with data aggregated across all user audits
 * - Recommendations section with unique recommendations by type
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const BRANCH_NAME = 'feature/dashboard-population-fix';
const COMMIT_MESSAGE = 'Fix dashboard overview by populating Energy Analysis and Recommendations sections';
const HEROKU_REMOTE = 'heroku';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function executeCommand(command, options = {}) {
  try {
    log(`➤ Executing: ${command}`, colors.cyan);
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    });
    return output.trim();
  } catch (error) {
    log(`Error executing command: ${command}`, colors.red);
    log(error.message, colors.red);
    if (error.stdout) log(`Stdout: ${error.stdout}`, colors.yellow);
    if (error.stderr) log(`Stderr: ${error.stderr}`, colors.red);
    throw error;
  }
}

function getGitStatus() {
  return executeCommand('git status --porcelain');
}

// Main deployment process
async function deploy() {
  try {
    // Check for uncommitted changes
    const status = getGitStatus();
    if (status) {
      log('You have uncommitted changes. Please commit or stash them before deploying.', colors.red);
      log('Uncommitted files:', colors.yellow);
      log(status, colors.yellow);
      process.exit(1);
    }

    // Get current branch
    const currentBranch = executeCommand('git rev-parse --abbrev-ref HEAD');
    log(`Current branch: ${currentBranch}`, colors.blue);

    // Create new branch for the changes
    log(`Creating branch ${BRANCH_NAME}...`, colors.magenta);
    try {
      executeCommand(`git checkout -b ${BRANCH_NAME}`);
    } catch (error) {
      // Branch might already exist, try to check it out
      executeCommand(`git checkout ${BRANCH_NAME}`);
      log(`Branch ${BRANCH_NAME} already exists, switched to it.`, colors.yellow);
    }

    // Commit changes
    log('Adding modified files...', colors.magenta);
    executeCommand('git add backend/src/services/dashboardService.enhanced.aggregation.ts');
    executeCommand('git add backend/src/services/dashboardService.enhanced.ts');
    executeCommand('git add backend/src/routes/dashboard.enhanced.ts');
    executeCommand('git add dashboard-overview-population-implementation-plan.md');

    log('Committing changes...', colors.magenta);
    executeCommand(`git commit -m "${COMMIT_MESSAGE}"`);

    // Push to Heroku
    log('Pushing to Heroku...', colors.green);
    executeCommand(`git push ${HEROKU_REMOTE} ${BRANCH_NAME}:main --force`);

    log('✓ Successfully deployed to Heroku!', colors.green);
    log(`Visit https://energy-audit-store-e66479ed4f2b.herokuapp.com/ to see the changes.`, colors.cyan);

    // Switch back to original branch
    log(`Switching back to ${currentBranch}...`, colors.blue);
    executeCommand(`git checkout ${currentBranch}`);

  } catch (error) {
    log('Deployment failed!', colors.red);
    process.exit(1);
  }
}

// Execute the deployment
deploy().catch(error => {
  log(`Unhandled error: ${error.message}`, colors.red);
  process.exit(1);
});
