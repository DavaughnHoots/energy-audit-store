/**
 * pull-heroku.js
 * Script to help pull the current Heroku app files
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Execute a command and return promise with stdout
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.dim}> ${command}${colors.reset}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`${colors.yellow}Warning: ${stderr}${colors.reset}`);
      }
      
      resolve(stdout);
    });
  });
}

/**
 * Print a message with color and formatting
 */
function printMessage(message, color = 'reset', isBright = false) {
  const bright = isBright ? colors.bright : '';
  console.log(`${bright}${colors[color]}${message}${colors.reset}`);
}

/**
 * Create a directory if it doesn't exist
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

/**
 * Check if heroku CLI is installed
 */
async function checkHerokuCLI() {
  try {
    const output = await runCommand('heroku --version');
    printMessage('✓ Heroku CLI is installed', 'green', true);
    return true;
  } catch (error) {
    printMessage('✗ Heroku CLI is not installed or not in PATH', 'red', true);
    printMessage('Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli', 'yellow');
    return false;
  }
}

/**
 * Check if user is logged in to Heroku
 */
async function checkHerokuLogin() {
  try {
    const output = await runCommand('heroku auth:whoami');
    printMessage(`✓ Logged in to Heroku as: ${output.trim()}`, 'green', true);
    return true;
  } catch (error) {
    printMessage('✗ Not logged in to Heroku', 'red', true);
    printMessage('Please login: heroku login', 'yellow');
    return false;
  }
}

/**
 * Check if app exists and user has access
 */
async function checkAppAccess(appName) {
  try {
    const output = await runCommand(`heroku apps:info -a ${appName}`);
    printMessage(`✓ App "${appName}" exists and you have access`, 'green', true);
    return true;
  } catch (error) {
    printMessage(`✗ App "${appName}" doesn't exist or you don't have access`, 'red', true);
    return false;
  }
}

/**
 * Get source bundle from Heroku
 */
async function getSourceBundle(appName, outputDir) {
  try {
    ensureDir(outputDir);
    const bundlePath = path.join(outputDir, 'source-bundle.tar.gz');
    
    printMessage('Requesting source bundle from Heroku...', 'blue', true);
    const output = await runCommand(`heroku builds:create -a ${appName} -s production -o ${bundlePath}`);
    
    printMessage(`✓ Source bundle downloaded to ${bundlePath}`, 'green', true);
    printMessage('Now extracting the bundle...', 'blue');
    
    // Extract the bundle
    await runCommand(`tar -xzf ${bundlePath} -C ${outputDir}`);
    printMessage('✓ Source bundle extracted', 'green', true);
    
    // Cleanup
    fs.unlinkSync(bundlePath);
    printMessage('✓ Temporary file cleaned up', 'green');
    
    return true;
  } catch (error) {
    printMessage('✗ Failed to get source bundle', 'red', true);
    printMessage('Alternative method: You can create a git clone:', 'yellow');
    printMessage('  git clone https://git.heroku.com/energy-audit-store.git', 'cyan');
    
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const appName = 'energy-audit-store';
  const outputDir = path.join(__dirname, 'app-files');
  
  printMessage('==============================================', 'blue', true);
  printMessage('    HEROKU APP FILES DOWNLOAD UTILITY', 'blue', true);
  printMessage('==============================================', 'blue', true);
  printMessage('This script will download the current files from the Heroku app\n', 'cyan');
  
  // Check prereqs
  const hasHerokuCLI = await checkHerokuCLI();
  
  if (!hasHerokuCLI) {
    printMessage('\nSince Heroku CLI is not available, use one of these alternative methods:', 'yellow');
    printMessage('1. Manual Git Clone (requires Heroku access):', 'bright');
    printMessage('   git clone https://git.heroku.com/energy-audit-store.git', 'cyan');
    printMessage('\n2. GitHub Repository (if available):', 'bright');
    printMessage('   git clone https://github.com/yourusername/energy-audit-store.git', 'cyan');
    return;
  }
  
  const isLoggedIn = await checkHerokuLogin();
  if (!isLoggedIn) {
    printMessage('Please log in to Heroku first: heroku login', 'yellow');
    return;
  }
  
  const hasAccess = await checkAppAccess(appName);
  if (!hasAccess) {
    printMessage('You need access to the Heroku app to continue', 'yellow');
    return;
  }
  
  // Download files
  await getSourceBundle(appName, outputDir);
  
  printMessage('\nDone! You can find the files in:', 'green', true);
  printMessage(outputDir, 'cyan');
}

// Run the script
main().catch(error => {
  printMessage(`An error occurred: ${error.message}`, 'red', true);
});
