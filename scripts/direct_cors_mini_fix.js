/**
 * Minimal CORS Fix Script 
 * 
 * This is an alternative approach that makes a very minimal, targeted change:
 * It directly adds just the OPTIONS handler for the problematic endpoint
 * to the existing server.ts file rather than replacing the entire file.
 * 
 * Use this if the full file replacement approach doesn't work.
 * 
 * Usage: node scripts/direct_cors_mini_fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'cors-auth-mini-fix';
const SERVER_FILE = 'backend/src/server.ts';
const BACKUP_FILE = 'backend/src/server.ts.mini-backup';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper function to log with timestamp
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Helper function to execute shell commands
function execCommand(command, options = {}) {
  const defaultOptions = { stdio: 'inherit' };
  log(`Executing: ${command}`, colors.blue);
  return execSync(command, { ...defaultOptions, ...options });
}

// Perform the minimal fix - just add the OPTIONS handler
function applyMinimalFix() {
  // Check if server file exists
  if (!fs.existsSync(SERVER_FILE)) {
    log(`Error: Server file not found: ${SERVER_FILE}`, colors.red);
    process.exit(1);
  }
  
  log(`Backing up current server file to ${BACKUP_FILE}`, colors.yellow);
  fs.copyFileSync(SERVER_FILE, BACKUP_FILE);
  
  // Read in the server file
  log('Reading server file...', colors.blue);
  let serverContent = fs.readFileSync(SERVER_FILE, 'utf8');
  
  // Prepare the OPTIONS handler code
  const timestamp = new Date().toISOString();
  const optionsHandlerCode = `
// =======================================
// DIRECT MINI FIX - CORS OPTIONS HANDLER ADDED: ${timestamp}
// =======================================
// This handler needs to be before any other middleware
app.options('/api/auth-token/token-info', (req, res) => {
  console.log('MINI FIX: OPTIONS handler executed for /api/auth-token/token-info');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Expires, Pragma, If-None-Match');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

`;
  
  // Find the right insertion point - after app is created but before any middleware
  const insertionPoint = "const app = express();";
  if (!serverContent.includes(insertionPoint)) {
    log('Error: Could not find insertion point in server file', colors.red);
    process.exit(1);
  }
  
  // Insert our OPTIONS handler right after app creation
  serverContent = serverContent.replace(
    insertionPoint,
    insertionPoint + '\n' + optionsHandlerCode
  );
  
  // Add a deployment verification marker
  serverContent = serverContent.replace(
    'server.listen(PORT, () => {',
    `server.listen(PORT, () => {\n  console.log('********************************************');\n  console.log('MINI CORS FIX ACTIVE: ${timestamp}');\n  console.log('********************************************');`
  );
  
  // Write the modified file back
  log('Writing modified server file...', colors.green);
  fs.writeFileSync(SERVER_FILE, serverContent);
  log('Mini CORS fix applied successfully', colors.green);
}

// Store information about the current branch
function storeCurrentBranchInfo() {
  try {
    const currentBranch = execCommand('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe' }).toString().trim();
    const currentCommit = execCommand('git rev-parse HEAD', { stdio: 'pipe' }).toString().trim();
    
    return {
      branch: currentBranch,
      commit: currentCommit
    };
  } catch (error) {
    log('Unable to get current branch information', colors.yellow);
    return {
      branch: 'unknown',
      commit: 'unknown'
    };
  }
}

// Main deployment script
async function deploy() {
  try {
    log('Starting MINIMAL CORS Fix Deployment', colors.green);
    log('This approach makes the smallest possible change to fix the CORS issue', colors.cyan);
    
    // Check if the terminal is in the correct directory
    if (!fs.existsSync('src') || !fs.existsSync('backend')) {
      log('Error: Please run this script from the project root directory', colors.red);
      return;
    }
    
    // Store original branch information
    const originalBranch = storeCurrentBranchInfo();
    log(`Current branch: ${originalBranch.branch}`, colors.blue);
    
    // Step 1: Apply the minimal fix to server.ts
    log('Applying minimal CORS fix...', colors.yellow);
    applyMinimalFix();
    
    // Step 2: Create new branch or checkout existing one
    try {
      execCommand(`git checkout -b ${BRANCH_NAME}`);
      log(`Created new branch: ${BRANCH_NAME}`, colors.green);
    } catch (error) {
      log(`Branch ${BRANCH_NAME} already exists, checking it out...`, colors.yellow);
      execCommand(`git checkout ${BRANCH_NAME}`);
    }
    
    // Step 3: Add and commit changes
    log('Adding modified server file to git...', colors.blue);
    execCommand(`git add ${SERVER_FILE}`);
    
    log('Committing changes...', colors.blue);
    execCommand(`git commit -m "Apply minimal CORS OPTIONS handler fix"`);
    
    // Step 4: Push to Heroku
    log('Deploying to Heroku...', colors.green);
    execCommand('git push heroku ' + BRANCH_NAME + ':main -f');
    
    log('\nDeployment completed successfully!', colors.green);
    log('Minimal CORS fix has been deployed!', colors.green);
    
    log('\nTo verify deployment:', colors.cyan);
    log('1. Check Heroku logs for the marker:', colors.reset);
    log('   heroku logs --tail --app energy-audit-store', colors.reset);
    log('2. Look for: "MINI CORS FIX ACTIVE: [timestamp]"', colors.reset);
    log('3. Visit the website and check if the CORS errors are resolved', colors.reset);
    
    log('\nTo rollback if needed:', colors.yellow); 
    log(`1. Copy the backup: cp ${BACKUP_FILE} ${SERVER_FILE}`, colors.reset);
    log('2. Commit the change: git add backend/src/server.ts', colors.reset);
    log('3. Push to Heroku: git push heroku cors-auth-mini-fix:main -f', colors.reset);
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, colors.red);
    log('Attempting to restore original files...', colors.yellow);
    
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        fs.copyFileSync(BACKUP_FILE, SERVER_FILE);
        log('Restored original server file', colors.green);
      }
    } catch (restoreError) {
      log(`Error during restoration: ${restoreError.message}`, colors.red);
    }
    
    process.exit(1);
  }
}

// Execute the deployment
deploy();
