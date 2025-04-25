/**
 * github-push-options.js
 * 
 * Script to help push changes to GitHub repository with different strategies
 */

const { exec } = require('child_process');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
 * Print a formatted message
 */
function print(message, color = 'reset', isBright = false) {
  const bright = isBright ? colors.bright : '';
  console.log(`${bright}${colors[color]}${message}${colors.reset}`);
}

/**
 * Ask a question and get user input
 */
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Execute a command and return promise with stdout
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    print(`${colors.dim}> ${command}${colors.reset}`);
    
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        print(`${colors.red}Error: ${error.message}${colors.reset}`);
        reject(error);
        return;
      }
      
      if (stderr && !stderr.includes('remote: Counting objects') && !stderr.includes('remote: Total')) {
        print(`${colors.yellow}Warning: ${stderr}${colors.reset}`);
      }
      
      resolve(stdout);
    });
  });
}

/**
 * Push current branch to GitHub
 */
async function pushCurrentBranch(branch, remoteRef) {
  try {
    await runCommand(`git push github ${branch}:${remoteRef}`);
    print(`Pushed local branch '${branch}' to GitHub as '${remoteRef}'`, 'green', true);
    return true;
  } catch (error) {
    print(`Failed to push to GitHub: ${error.message}`, 'red');
    return false;
  }
}

/**
 * List all branches
 */
async function listBranches() {
  try {
    print('\nLocal branches:', 'cyan');
    const localOutput = await runCommand('git branch');
    console.log(localOutput);
    
    print('\nRemote GitHub branches:', 'cyan');
    const remoteOutput = await runCommand('git branch -r | grep github');
    console.log(remoteOutput);
    
    return true;
  } catch (error) {
    print(`Error listing branches: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Replace GitHub main branch with current branch (force push)
 */
async function replaceGitHubMain(branch) {
  try {
    const confirmation = await ask(`⚠️ WARNING: This will FORCE PUSH your branch '${branch}' to GitHub's 'main', potentially OVERWRITING existing content. Continue? (yes/no): `);
    
    if (confirmation.toLowerCase() !== 'yes') {
      print('Operation cancelled', 'yellow');
      return false;
    }
    
    await runCommand(`git push -f github ${branch}:main`);
    print('Successfully force-pushed to GitHub main branch', 'green', true);
    return true;
  } catch (error) {
    print(`Error replacing GitHub main: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Create a new branch on GitHub
 */
async function createNewGitHubBranch(localBranch, newBranchName) {
  try {
    await runCommand(`git push github ${localBranch}:${newBranchName}`);
    print(`Created new branch '${newBranchName}' on GitHub`, 'green', true);
    return true;
  } catch (error) {
    print(`Error creating new branch: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Push as a pull request branch
 */
async function pushAsPullRequest(localBranch, prBranchName) {
  try {
    await runCommand(`git push github ${localBranch}:${prBranchName}`);
    print(`Pushed to GitHub as branch '${prBranchName}'`, 'green', true);
    
    print('\nTo create a pull request:', 'cyan');
    print(`1. Go to: https://github.com/DavaughnHoots/energy-audit-store/pull/new/${prBranchName}`, 'cyan');
    print('2. Fill in the pull request details', 'cyan');
    print('3. Submit the pull request', 'cyan');
    
    return true;
  } catch (error) {
    print(`Error pushing PR branch: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  print('==============================================', 'blue', true);
  print('         GITHUB PUSH OPTIONS UTILITY', 'blue', true);
  print('==============================================', 'blue', true);
  print('This script helps push your changes to GitHub\n', 'cyan');
  
  // Get current branch
  const branchOutput = await runCommand('git branch --show-current');
  const currentBranch = branchOutput.trim();
  print(`Current branch: ${currentBranch}`, 'green');
  
  // Show available branches
  await listBranches();
  
  // Show push options
  print('\nPush options:', 'blue', true);
  print('1. Push current branch to GitHub with same name', 'cyan');
  print('2. Create a new branch on GitHub', 'cyan');
  print('3. Replace GitHub main branch with current branch (⚠️ Force push)', 'cyan');
  print('4. Push as a pull request branch', 'cyan');
  
  const option = await ask('\nChoose option (1-4): ');
  
  switch (option) {
    case '1':
      await pushCurrentBranch(currentBranch, currentBranch);
      break;
      
    case '2':
      const newBranchName = await ask('Enter new branch name for GitHub: ');
      await createNewGitHubBranch(currentBranch, newBranchName);
      break;
      
    case '3':
      await replaceGitHubMain(currentBranch);
      break;
      
    case '4':
      const prBranchName = await ask('Enter pull request branch name (e.g., feature/analysis-tools): ');
      await pushAsPullRequest(currentBranch, prBranchName);
      break;
      
    default:
      print('Invalid option selected', 'red');
  }
  
  print('\nOperation completed.', 'green', true);
  rl.close();
}

// Run the script
main().catch(error => {
  print(`Fatal error: ${error.message}`, 'red', true);
  rl.close();
});
