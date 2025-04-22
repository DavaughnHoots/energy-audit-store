/**
 * Enhanced deployment script for auth middleware token handling fix
 * Fixes the issue where 'undefined' tokens are causing authentication failures
 * 
 * This script:
 * 1. Creates a git branch for the fix
 * 2. Commits the middleware changes
 * 3. Deploys to Heroku
 * 4. Provides pre and post-deployment verification
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/auth-middleware-token-handling';
const COMMIT_MESSAGE = 'Fix auth middleware token handling to prevent dashboard errors';
const VERSION_TAG = 'v1.1'; // Should match AUTH_MIDDLEWARE_VERSION in auth.ts

// Define paths
const AUTH_MIDDLEWARE_PATH = 'backend/src/middleware/auth.ts';

// Create timestamp for logging
const timestamp = new Date().toISOString().replace(/:/g, '-');
const LOG_FILE = `auth_middleware_deploy_${timestamp}.log`;

// Helper to log both to console and to a file
function log(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Helper to execute commands with logging
function execute(command, hideOutput = false) {
  log(`Executing: ${command}`);
  try {
    const options = hideOutput ? { stdio: 'pipe' } : { stdio: 'inherit' };
    const output = execSync(command, options);
    if (hideOutput && output) {
      log(`Command output: ${output.toString().trim()}`);
    }
    return output;
  } catch (error) {
    log(`ERROR: Command failed with code ${error.status}`);
    if (error.stdout) log(`STDOUT: ${error.stdout.toString()}`);
    if (error.stderr) log(`STDERR: ${error.stderr.toString()}`);
    throw error;
  }
}

log('Starting auth middleware token handling fix deployment...');

// Pre-deployment verification
log('Pre-deployment verification:');

// Check if auth middleware file exists
if (!fs.existsSync(AUTH_MIDDLEWARE_PATH)) {
  log(`ERROR: Auth middleware file not found at ${AUTH_MIDDLEWARE_PATH}`);
  process.exit(1);
}

// Check for version identifier in auth middleware
const authMiddlewareContent = fs.readFileSync(AUTH_MIDDLEWARE_PATH, 'utf8');
if (!authMiddlewareContent.includes(`AUTH_MIDDLEWARE_VERSION = '${VERSION_TAG}'`)) {
  log(`ERROR: Version tag '${VERSION_TAG}' not found in auth middleware file`);
  process.exit(1);
}

// Check for our logging markers
if (!authMiddlewareContent.includes(`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}]`)) {
  log(`ERROR: Logging markers not found in auth middleware file`);
  process.exit(1);
}

log('✅ Auth middleware file verified with correct version and logging markers');

// Create new branch if it doesn't exist
try {
  log(`Creating branch: ${BRANCH_NAME}`);
  execute(`git checkout -b ${BRANCH_NAME}`, true);
} catch (error) {
  log(`Branch ${BRANCH_NAME} might already exist, attempting to switch to it...`);
  try {
    execute(`git checkout ${BRANCH_NAME}`, true);
  } catch (checkoutError) {
    log(`Failed to switch to branch ${BRANCH_NAME}. Continuing with current branch...`);
  }
}

// Stage the changes
log('Staging changes...');
try {
  execute(`git add ${AUTH_MIDDLEWARE_PATH}`);
  log('✅ Changes staged');
} catch (error) {
  log('Failed to stage changes');
  process.exit(1);
}

// Commit the changes
log('Committing changes...');
try {
  execute(`git commit -m "${COMMIT_MESSAGE}"`);
  log('✅ Changes committed');
} catch (error) {
  log('No changes to commit or commit failed');
  // Continue anyway since we may have already committed the changes
}

// Push to GitHub (optional)
const pushToGithub = false; // Set to true if you want to push to GitHub
if (pushToGithub) {
  log('Pushing to GitHub...');
  try {
    execute(`git push origin ${BRANCH_NAME}`);
    log('✅ Changes pushed to GitHub');
  } catch (error) {
    log('Failed to push to GitHub. Continuing with Heroku deployment...');
  }
}

// Deploy to Heroku
log('Deploying to Heroku...');
try {
  execute(`git push heroku ${BRANCH_NAME}:main`);
  log('✅ Successfully deployed to Heroku');
} catch (error) {
  log('Failed to deploy to Heroku');
  process.exit(1);
}

// Post-deployment verification
log('Post-deployment verification:');
log('1. Checking for auth middleware logs in Heroku logs...');

try {
  // Wait a moment for logs to populate
  log('Waiting 5 seconds for logs to populate...');
  setTimeout(() => {
    try {
      // Fetch Heroku logs and look for our marker
      const logs = execute('heroku logs --source app --num 200', true).toString();
      const authLogCount = (logs.match(new RegExp(`\\[AUTH-FIX-${VERSION_TAG}\\]`, 'g')) || []).length;

      if (authLogCount > 0) {
        log(`✅ Found ${authLogCount} auth middleware logs with version ${VERSION_TAG} marker`);
      } else {
        log(`⚠️ Warning: No auth middleware logs found with version ${VERSION_TAG} marker`);
      }

      // Check for specific auth flow patterns
      const tokenExtractionLogs = (logs.match(/\[AUTH-FIX-.*?\] (Raw Auth Header|Auth header parts length|Extracted token from header|Using token from cookie)/g) || []).length;
      if (tokenExtractionLogs > 0) {
        log(`✅ Found ${tokenExtractionLogs} token extraction log entries`);
      } else {
        log(`⚠️ Warning: No token extraction log entries found`);
      }

      log('\n🎉 Deployment complete!');
      log('\nVerification steps:');
      log('1. Monitor Heroku logs for auth middleware logs:');
      log('   heroku logs --tail --source app | grep AUTH-FIX');
      log('2. Have users test login and dashboard access');
      log('3. Verify there are no more "Token verification failed: AuthError: Invalid token" errors in logs');
      log(`\nDeployment log saved to: ${LOG_FILE}`);
    } catch (logError) {
      log(`Error checking Heroku logs: ${logError.message}`);
    }
  }, 5000);
} catch (error) {
  log(`Error in post-deployment verification: ${error.message}`);
}
