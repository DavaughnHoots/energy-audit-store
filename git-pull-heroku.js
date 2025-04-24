/**
 * git-pull-heroku.js
 * Script to help pull the Heroku app files using Git
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
function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.dim}> ${command}${colors.reset}`);
    
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        reject(error);
        return;
      }
      
      if (stderr && !stderr.includes('Cloning into')) {
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
 * Check if Git is installed
 */
async function checkGit() {
  try {
    const output = await runCommand('git --version');
    printMessage(`✓ Git is installed: ${output.trim()}`, 'green', true);
    return true;
  } catch (error) {
    printMessage('✗ Git is not installed or not in PATH', 'red', true);
    printMessage('Please install Git: https://git-scm.com/downloads', 'yellow');
    return false;
  }
}

/**
 * Clone the Heroku repository
 */
async function cloneHerokuRepo(appName, outputDir) {
  try {
    // Make sure output directory exists and is empty
    ensureDir(outputDir);
    
    // Use shallow clone to save time and bandwidth
    printMessage('Cloning the Heroku repository...', 'blue', true);
    await runCommand(`git clone https://git.heroku.com/${appName}.git --depth=1 .`, outputDir);
    
    printMessage('✓ Repository cloned successfully', 'green', true);
    
    // Check what files were cloned
    const files = await runCommand('ls -la', outputDir);
    printMessage('\nFiles in the cloned repository:', 'cyan');
    console.log(files);
    
    return true;
  } catch (error) {
    printMessage('✗ Failed to clone repository', 'red', true);
    printMessage('This could be due to authentication issues or the repository not existing', 'yellow');
    printMessage('\nAlternative methods:', 'yellow');
    printMessage('1. Use Heroku CLI:', 'bright');
    printMessage('   heroku git:clone -a energy-audit-store', 'cyan');
    printMessage('\n2. Check if there is a GitHub repository associated with this project', 'bright');
    
    return false;
  }
}

/**
 * Validate the cloned repository
 */
async function validateRepo(repoDir) {
  try {
    // Check if package.json exists
    const pkgPath = path.join(repoDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkgContent = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(pkgContent);
      printMessage(`✓ Valid Node.js project: ${pkg.name} v${pkg.version}`, 'green', true);
      return true;
    } else {
      printMessage('✗ No package.json found', 'red');
      return false;
    }
  } catch (error) {
    printMessage(`✗ Failed to validate repository: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Get branch information
 */
async function getBranchInfo(repoDir) {
  try {
    const branchInfo = await runCommand('git branch -v', repoDir);
    const remoteInfo = await runCommand('git remote -v', repoDir);
    
    printMessage('\nBranch information:', 'cyan');
    console.log(branchInfo);
    
    printMessage('\nRemote information:', 'cyan');
    console.log(remoteInfo);
    
    return true;
  } catch (error) {
    printMessage(`✗ Failed to get branch info: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const appName = 'energy-audit-store';
  const outputDir = path.join(__dirname, 'heroku-repo');
  
  printMessage('==============================================', 'blue', true);
  printMessage('     GIT HEROKU REPOSITORY PULL UTILITY', 'blue', true);
  printMessage('==============================================', 'blue', true);
  printMessage('This script will clone the Heroku Git repository\n', 'cyan');
  
  // Check prereqs
  const hasGit = await checkGit();
  if (!hasGit) {
    printMessage('Git is required to continue', 'yellow');
    return;
  }
  
  // Clone the repository
  ensureDir(outputDir);
  const cloneSuccess = await cloneHerokuRepo(appName, outputDir);
  
  if (cloneSuccess) {
    // Validate and get info
    await validateRepo(outputDir);
    await getBranchInfo(outputDir);
    
    printMessage('\nDone! You can find the files in:', 'green', true);
    printMessage(outputDir, 'cyan');
    
    printMessage('\nTo start working with the repository:', 'green');
    printMessage(`cd ${outputDir}`, 'cyan');
    printMessage('npm install', 'cyan');
  }
}

// Run the script
main().catch(error => {
  printMessage(`An error occurred: ${error.message}`, 'red', true);
});
