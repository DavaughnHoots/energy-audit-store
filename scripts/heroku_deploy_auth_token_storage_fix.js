/**
 * Heroku Deployment Script - Auth Token Storage Fix
 * 
 * This script deploys the auth token storage fix to Heroku.
 * It updates the cookieUtils.ts, AuthContext.tsx, and App.tsx files,
 * and adds the auth-reset.html page for user self-service auth reset.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Config
const DEPLOY_BRANCH = 'auth-token-storage-fix';
const REMOTE_BRANCH = 'main';
const DEPLOY_MESSAGE = 'Fix auth token storage and add reset tool';

const FILES_TO_UPDATE = {
  cookieUtils: {
    source: 'src/utils/cookieUtils.ts',
    description: 'Enhanced cookie validation and token sync'
  },
  authContext: {
    source: 'src/context/AuthContext.tsx',
    description: 'Improved auth context with token verification'
  },
  app: {
    source: 'src/App.tsx',
    description: 'Added route to auth reset tool'
  },
  authResetTool: {
    source: 'public/auth-reset.html',
    description: 'Authentication reset diagnostic tool'
  },
  deploymentDocs: {
    source: 'energy-audit-vault/operations/deployment/auth-token-storage-fix-deployment.md',
    description: 'Deployment documentation'
  }
};

// Logging utility
function log(message, type = 'info') {
  const date = new Date().toISOString();
  const prefix = type === 'error' ? '❌ ERROR' : 
               type === 'success' ? '✅ SUCCESS' : 
               type === 'warning' ? '⚠️ WARNING' : 
               '📌 INFO';
  
  console.log(`[${date}] ${prefix}: ${message}`);
}

// Execute command and handle errors
function execute(command) {
  try {
    log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    log(output.trim());
    return output;
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    log(error.message, 'error');
    if (error.stdout) log(`stdout: ${error.stdout}`);
    if (error.stderr) log(`stderr: ${error.stderr}`);
    throw error;
  }
}

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Create backup of file
function backupFile(filePath) {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  if (fileExists(filePath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up ${filePath} to ${backupPath}`, 'success');
  }
}

// Verify git is clean before starting
function checkGitStatus() {
  const status = execute('git status --porcelain');
  if (status.trim() !== '') {
    log('Git working directory is not clean. Please commit or stash changes before deploying.', 'error');
    process.exit(1);
  }
}

// Create a new branch for the deployment
function createDeploymentBranch() {
  try {
    // Check if branch exists locally
    const localBranches = execute('git branch').split('\n');
    const branchExists = localBranches.some(branch => branch.trim().replace('* ', '') === DEPLOY_BRANCH);
    
    if (branchExists) {
      log(`Branch ${DEPLOY_BRANCH} already exists locally. Checking out...`);
      execute(`git checkout ${DEPLOY_BRANCH}`);
    } else {
      log(`Creating and checking out new branch: ${DEPLOY_BRANCH}`);
      execute(`git checkout -b ${DEPLOY_BRANCH}`);
    }
  } catch (error) {
    log(`Failed to create deployment branch: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Deploy to Heroku
function deployToHeroku() {
  try {
    log('Pushing to Heroku...');
    execute(`git push heroku ${DEPLOY_BRANCH}:${REMOTE_BRANCH} --force`);
    log('Deployed to Heroku successfully!', 'success');
  } catch (error) {
    log(`Heroku deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Verify files exist before deployment
function verifyFiles() {
  for (const [key, fileInfo] of Object.entries(FILES_TO_UPDATE)) {
    if (!fileExists(fileInfo.source)) {
      log(`Required file ${fileInfo.source} not found.`, 'error');
      process.exit(1);
    }
    log(`Verified file exists: ${fileInfo.source}`, 'success');
  }
}

// Main deployment function
async function deploy() {
  try {
    log('Starting auth token storage fix deployment...');
    
    // Verify files and git status
    verifyFiles();
    checkGitStatus();
    
    // Create deployment branch
    createDeploymentBranch();
    
    // Create backups of files we'll modify
    Object.values(FILES_TO_UPDATE).forEach(fileInfo => {
      backupFile(fileInfo.source);
    });
    
    // Add files to git
    log('Adding files to git...');
    const filesToAdd = Object.values(FILES_TO_UPDATE).map(f => f.source).join(' ');
    execute(`git add ${filesToAdd}`);
    
    // Commit changes
    log('Committing changes...');
    execute(`git commit -m "${DEPLOY_MESSAGE}"`);
    
    // Push to origin (optional)
    log('Pushing to origin...');
    try {
      execute(`git push origin ${DEPLOY_BRANCH}`);
    } catch (error) {
      log('Failed to push to origin. Continuing with Heroku deployment...', 'warning');
    }
    
    // Deploy to Heroku
    deployToHeroku();
    
    // Return to previous branch (optional)
    log('Returning to main branch...');
    execute('git checkout main');
    
    log('Deployment complete!', 'success');
    log('------------------------------------');
    log('Auth token storage fix has been deployed to Heroku.');
    log('Files updated:');
    Object.values(FILES_TO_UPDATE).forEach(fileInfo => {
      log(`- ${fileInfo.source}: ${fileInfo.description}`);
    });
    log('------------------------------------');
  } catch (error) {
    log(`Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Execute the deployment
deploy();
