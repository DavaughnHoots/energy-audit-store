/**
 * Deployment script for token undefined cookie fix
 * 
 * This script automatically deploys the fix for the token undefined cookie issue, which
 * addresses authentication failures when users first log in and navigate to their dashboard.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Branch name for the fix
const BRANCH_NAME = 'fix/token-undefined-cookie';

// Files that need to be updated
const FILES_TO_VERIFY = [
  'src/utils/cookieUtils.ts',
  'src/context/AuthContext.tsx',
  'src/services/apiClient.ts'
];

// Create a timestamped backup folder
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
const backupDir = path.join('temp_deploy', `backup-${timestamp}`);

// Create backup directory
try {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`✅ Created backup directory at ${backupDir}`);
} catch (err) {
  console.error(`Failed to create backup directory: ${err.message}`);
  process.exit(1);
}

// Back up the original files
FILES_TO_VERIFY.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(backupDir, path.basename(filePath));
      fs.copyFileSync(filePath, backupPath);
      console.log(`✅ Backed up ${filePath} to ${backupPath}`);
    } else {
      console.warn(`⚠️ Warning: ${filePath} does not exist, skipping backup`);
    }
  } catch (err) {
    console.error(`Failed to back up ${filePath}: ${err.message}`);
  }
});

// Check for the cookie package
try {
  console.log('Checking for required cookie package...');
  require.resolve('cookie');
  console.log('✅ cookie package is installed');
} catch (err) {
  console.log('⚠️ cookie package not found, installing...');
  execSync('npm install cookie @types/cookie --save');
  console.log('✅ Installed cookie package');
}

// Helper function to run git commands and handle errors
function runGitCommand(command, errorMessage) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (err) {
    console.error(`${errorMessage}: ${err.message}`);
    return null;
  }
}

// Create and checkout a new branch
console.log(`Creating fix branch: ${BRANCH_NAME}`);
let branchExists = false;

try {
  const branches = execSync('git branch').toString();
  if (branches.includes(BRANCH_NAME)) {
    branchExists = true;
    console.log(`Branch ${BRANCH_NAME} already exists, checking it out`);
    execSync(`git checkout ${BRANCH_NAME}`);
  } else {
    console.log(`Creating new branch ${BRANCH_NAME}`);
    execSync(`git checkout -b ${BRANCH_NAME}`);
  }
  console.log(`✅ Now on branch ${BRANCH_NAME}`);
} catch (err) {
  console.error(`Failed to create/checkout branch: ${err.message}`);
  process.exit(1);
}

// Verify files exist and have the expected changes
let changesNeeded = false;
FILES_TO_VERIFY.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ${filePath} is missing, cannot deploy fix`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for specific markers in each file
  if (filePath === 'src/utils/cookieUtils.ts' && !content.includes('setCookie')) {
    console.log(`❌ setCookie function not found in ${filePath}`);
    changesNeeded = true;
  }
  
  if (filePath === 'src/context/AuthContext.tsx' && !content.includes('import { getCookie, setCookie }')) {
    console.log(`❌ setCookie import not found in ${filePath}`);
    changesNeeded = true;
  }
  
  if (filePath === 'src/services/apiClient.ts' && !content.includes('setCookie(\'accessToken\'')) {
    console.log(`❌ setCookie usage not found in ${filePath}`);
    changesNeeded = true;
  }
});

if (changesNeeded) {
  console.error('❌ Some required changes are missing. Please run the manual fix process first.');
  process.exit(1);
}

console.log('✅ All required files verified with changes in place');

// Commit changes if they exist
try {
  const status = execSync('git status --porcelain').toString();
  if (status.trim()) {
    console.log('Changes detected, committing...');
    execSync('git add .');
    execSync('git commit -m "Fix token undefined cookie issue causing dashboard auth errors"');
    console.log('✅ Changes committed');
  } else {
    console.log('No changes to commit, files may already have the fixes applied');
  }
} catch (err) {
  console.error(`Failed to commit changes: ${err.message}`);
  process.exit(1);
}

// Offer to push to GitHub
console.log('\n🚀 Ready to deploy!');
console.log('\nYou can now deploy the fix using the following steps:');
console.log(`
1. Push to GitHub:
   git push origin ${BRANCH_NAME}

2. Deploy to Heroku:
   git push heroku ${BRANCH_NAME}:main

3. Verify the fix is working by testing the login and dashboard functionality
`);

console.log('✅ Deployment preparation completed successfully');
