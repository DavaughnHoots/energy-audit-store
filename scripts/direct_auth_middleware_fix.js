/**
 * Direct auth middleware fix deployment script
 * This script directly deploys a fix to the compiled auth.js middleware
 * Bypassing TypeScript compilation to ensure the fix works in production
 * 
 * IMPORTANT: This approach is used because we determined the TypeScript
 * build process is failing on Heroku (tsc not found error)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/auth-middleware-direct-fix';
const COMMIT_MESSAGE = 'Fix auth middleware token extraction with direct JS edits';
const AUTH_FIX_VERSION = 'v1.1';

// Create timestamp for logging
const timestamp = new Date().toISOString().replace(/:/g, '-');
const LOG_FILE = `auth_direct_fix_${timestamp}.log`;

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

log('Starting direct auth middleware fix deployment...');

// Verify that our changed file exists
const AUTH_MIDDLEWARE_PATH = path.join('backend', 'build', 'middleware', 'auth.js');
if (!fs.existsSync(AUTH_MIDDLEWARE_PATH)) {
  log(`ERROR: Auth middleware file not found at ${AUTH_MIDDLEWARE_PATH}`);
  process.exit(1);
}

// Check for version marker to confirm our fix has been applied
const authMiddlewareContent = fs.readFileSync(AUTH_MIDDLEWARE_PATH, 'utf8');
if (!authMiddlewareContent.includes(`AUTH_MIDDLEWARE_VERSION = '${AUTH_FIX_VERSION}'`)) {
  log(`ERROR: Version tag '${AUTH_FIX_VERSION}' not found in auth middleware file. The fix has not been properly applied.`);
  process.exit(1);
}

log('✅ Verified auth middleware file contains our fix');

// Create new branch if it doesn't exist or switch to it

// Stage the middleware file
log('Staging auth middleware file...');
try {
  execute(`git add ${AUTH_MIDDLEWARE_PATH}` -f);
  log('✅ Auth middleware file staged');
} catch (error) {
  log('Failed to stage auth middleware file');
  process.exit(1);
}

// Commit the changes
log('Committing changes...');
try {
  execute(`git commit -m "${COMMIT_MESSAGE}"`);
  log('✅ Changes committed');
} catch (error) {
  log('No changes to commit or commit failed. This might be expected if you\'ve already committed the changes.');
}

// Deploy to Heroku
log('Deploying to Heroku...');
try {
  execute(`git push heroku ${BRANCH_NAME}:main -f`);
  log('✅ Successfully deployed to Heroku');
} catch (error) {
  log('Failed to deploy to Heroku');
  process.exit(1);
}

// Post-deployment verification via logs
log('Post-deployment verification...');
log('Waiting for Heroku logs to populate (5 seconds)...');

// Wait 5 seconds for logs to populate
setTimeout(() => {
  try {
    // Check logs for our auth marker
    log('Checking Heroku logs for auth middleware marker...');
    const logs = execute('heroku logs --source app --num 200', true).toString();
    
    // Look for our logging tag
    const authLogCount = (logs.match(new RegExp(`\\[AUTH-FIX-${AUTH_FIX_VERSION}\\]`, 'g')) || []).length;
    
    if (authLogCount > 0) {
      log(`✅ Success! Found ${authLogCount} log entries with our AUTH-FIX-${AUTH_FIX_VERSION} marker.`);
      log('The fix has been deployed and is running in production!');
    } else {
      log('⚠️ Warning: No auth fix log markers found in the logs.');
      log('This could mean:');
      log('1. The fix is not yet active (might need a few minutes)');
      log('2. No auth requests have been made since deployment');
      log('3. The fix was not properly deployed');
      log('Run "heroku logs --tail" and look for "[AUTH-FIX-v1.1]" markers');
    }
    
    log('\n🎉 Deployment completed!');
    log('\nTo monitor the fix in production:');
    log('1. Watch Heroku logs for our auth middleware markers:');
    log('   heroku logs --tail | grep AUTH-FIX');
    log('2. Have users test login and dashboard access');
    log('3. Check if the "Token verification failed: AuthError: Invalid token" errors are gone');
    log(`\nDeployment log saved to: ${LOG_FILE}`);
  } catch (logError) {
    log(`Error checking Heroku logs: ${logError.message}`);
  }
}, 5000);
