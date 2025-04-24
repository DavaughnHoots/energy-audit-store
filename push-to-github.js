/**
 * push-to-github.js
 * 
 * This script helps push the energy-audit-store tools to GitHub
 */

const { exec } = require('child_process');
const readline = require('readline');

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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
 * Check if GitHub CLI is installed
 */
async function checkGitHubCLI() {
  try {
    await runCommand('gh --version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if Git is initialized
 */
async function isGitInitialized() {
  try {
    await runCommand('git status');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize Git repository
 */
async function initGit() {
  try {
    await runCommand('git init');
    print('Git repository initialized', 'green');
    return true;
  } catch (error) {
    print('Failed to initialize Git repository', 'red');
    return false;
  }
}

/**
 * Get list of existing remotes
 */
async function getRemotes() {
  try {
    const output = await runCommand('git remote -v');
    return output.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    return [];
  }
}

/**
 * Add GitHub remote
 */
async function addGitHubRemote(repoUrl) {
  try {
    await runCommand(`git remote add origin ${repoUrl}`);
    print(`Added GitHub remote: ${repoUrl}`, 'green');
    return true;
  } catch (error) {
    print(`Failed to add GitHub remote: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Create .gitignore file
 */
async function createGitignore() {
  const fs = require('fs');
  const gitignoreContent = `# Node.js
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log
package-lock.json

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build artifacts
dist/
build/
app-analysis/
heroku-repo/

# OS-specific
.DS_Store
Thumbs.db
`;

  fs.writeFileSync('.gitignore', gitignoreContent);
  print('Created .gitignore file', 'green');
}

/**
 * Add files to Git
 */
async function addFiles() {
  try {
    await runCommand('git add .');
    print('Added files to Git staging area', 'green');
    return true;
  } catch (error) {
    print(`Failed to add files: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Commit changes
 */
async function commitChanges(message) {
  try {
    await runCommand(`git commit -m "${message}"`);
    print(`Committed changes: ${message}`, 'green');
    return true;
  } catch (error) {
    print(`Failed to commit: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Push to GitHub
 */
async function pushToGitHub(branch = 'main') {
  try {
    await runCommand(`git push -u origin ${branch}`);
    print(`Successfully pushed to GitHub (${branch})`, 'green', true);
    return true;
  } catch (error) {
    print(`Failed to push to GitHub: ${error.message}`, 'red');
    
    // Check if it's a typical first-push problem
    if (error.message.includes('rejected') && error.message.includes('master -> master (non-fast-forward)')) {
      print('It looks like the remote repository already has content.', 'yellow');
      print('Try using git pull --rebase origin master before pushing.', 'cyan');
    }
    
    return false;
  }
}

/**
 * Create GitHub repository using GitHub CLI
 */
async function createGitHubRepo(repoName, description) {
  try {
    const visibility = await ask(`Make the repository public? (y/n): `);
    const visibilityFlag = visibility.toLowerCase() === 'y' ? '--public' : '--private';
    
    await runCommand(`gh repo create ${repoName} --description "${description}" ${visibilityFlag}`);
    print(`Created GitHub repository: ${repoName}`, 'green');
    return `https://github.com/${repoName}.git`;
  } catch (error) {
    print(`Failed to create GitHub repository: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  print('==============================================', 'blue', true);
  print('        PUSH TO GITHUB UTILITY', 'blue', true);
  print('==============================================', 'blue', true);
  print('This script helps push your code to GitHub\n', 'cyan');
  
  // Check if Git is initialized
  let isGit = await isGitInitialized();
  if (!isGit) {
    print('Git is not initialized in this directory.', 'yellow');
    const initAnswer = await ask('Initialize Git? (y/n): ');
    if (initAnswer.toLowerCase() === 'y') {
      isGit = await initGit();
      if (!isGit) {
        print('Cannot continue without Git initialization.', 'red');
        rl.close();
        return;
      }
    } else {
      print('Cannot continue without Git initialization.', 'red');
      rl.close();
      return;
    }
  } else {
    print('Git repository already initialized.', 'green');
  }
  
  // Create .gitignore if needed
  const fs = require('fs');
  if (!fs.existsSync('.gitignore')) {
    const createGitignoreAnswer = await ask('Create .gitignore file? (y/n): ');
    if (createGitignoreAnswer.toLowerCase() === 'y') {
      await createGitignore();
    }
  }
  
  // Check for remotes
  const remotes = await getRemotes();
  let githubUrl = '';
  
  if (remotes.some(remote => remote.includes('origin'))) {
    print('GitHub remote (origin) already configured:', 'cyan');
    console.log(remotes.filter(remote => remote.includes('origin')).join('\n'));
    
    const useExistingRemote = await ask('Use existing remote? (y/n): ');
    if (useExistingRemote.toLowerCase() === 'y') {
      githubUrl = remotes.find(remote => remote.includes('origin')).split('\t')[1].split(' ')[0];
    } else {
      const removeRemote = await ask('Remove existing remote? (y/n): ');
      if (removeRemote.toLowerCase() === 'y') {
        await runCommand('git remote remove origin');
        print('Removed existing remote.', 'yellow');
      } else {
        print('Cannot continue with conflicting remote names.', 'red');
        rl.close();
        return;
      }
    }
  }
  
  // Configure GitHub remote if not already done
  if (!githubUrl) {
    print('\nGitHub remote not configured. You have two options:', 'yellow');
    print('1. Use an existing GitHub repository', 'cyan');
    print('2. Create a new GitHub repository', 'cyan');
    
    const option = await ask('Choose option (1/2): ');
    
    if (option === '1') {
      githubUrl = await ask('Enter GitHub repository URL (e.g., https://github.com/username/repo.git): ');
      await addGitHubRemote(githubUrl);
    } else if (option === '2') {
      const hasGitHubCLI = await checkGitHubCLI();
      
      if (hasGitHubCLI) {
        print('\nUsing GitHub CLI to create repository...', 'cyan');
        
        const username = await ask('Enter your GitHub username: ');
        const repoName = await ask('Enter repository name: ');
        const description = await ask('Enter repository description: ');
        
        const fullRepoName = `${username}/${repoName}`;
        githubUrl = await createGitHubRepo(fullRepoName, description);
        
        if (githubUrl) {
          await addGitHubRemote(githubUrl);
        } else {
          githubUrl = await ask('Enter GitHub repository URL manually: ');
          await addGitHubRemote(githubUrl);
        }
      } else {
        print('\nGitHub CLI not found. Please create the repository on GitHub first.', 'yellow');
        print('Visit: https://github.com/new', 'cyan');
        
        githubUrl = await ask('Enter the URL of the created repository: ');
        await addGitHubRemote(githubUrl);
      }
    } else {
      print('Invalid option. Exiting.', 'red');
      rl.close();
      return;
    }
  }
  
  // Check if there are changes to commit
  const status = await runCommand('git status --porcelain');
  if (status.trim() !== '') {
    print('\nUncommitted changes detected.', 'yellow');
    
    const commitMsg = await ask('Enter commit message [Initial commit of Energy Audit Store Analysis Tools]: ');
    const finalCommitMsg = commitMsg.trim() || 'Initial commit of Energy Audit Store Analysis Tools';
    
    await addFiles();
    await commitChanges(finalCommitMsg);
  } else {
    print('\nNo changes to commit.', 'yellow');
  }
  
  // Push to GitHub
  print('\nReady to push to GitHub!', 'green', true);
  const branchName = await ask('Enter branch name [main]: ');
  const finalBranchName = branchName.trim() || 'main';
  
  const pushConfirm = await ask(`Push to GitHub (${finalBranchName})? (y/n): `);
  if (pushConfirm.toLowerCase() === 'y') {
    const success = await pushToGitHub(finalBranchName);
    
    if (success) {
      print('\nSuccessfully pushed to GitHub!', 'green', true);
      if (githubUrl) {
        const repoWebUrl = githubUrl.replace('.git', '').replace('git@github.com:', 'https://github.com/');
        print(`View your repository at: ${repoWebUrl}`, 'cyan');
      }
    }
  }
  
  rl.close();
}

// Run the script
main().catch(error => {
  print(`Fatal error: ${error.message}`, 'red', true);
  rl.close();
});
