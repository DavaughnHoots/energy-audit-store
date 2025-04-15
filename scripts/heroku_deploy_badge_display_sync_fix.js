/**
 * Badge Display & Dashboard Sync Fix Deployment Script
 * 
 * This script deploys fixes for:
 * 1. Badge progress calculation issues (badges showing 0% despite high audit counts)
 * 2. Badge duplication problems (same badge appearing in multiple categories)
 * 3. Dashboard data synchronization issues (badges not reflecting actual metrics)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-dashboard-sync';
const COMMIT_MESSAGE = 'Fix badge display issues with dashboard sync and deduplication';

// Files that need to be deployed
const FILES_TO_STAGE = [
  'src/hooks/useBadgeDashboardSync.ts',
  'src/components/badges/SynchronizedBadgesTab.tsx',
  'src/components/badges/BadgesTab.tsx'
];

// Utility function for colored console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  log(`\n-------- ${description} --------`, 'cyan');
  log(`Executing: ${command}`, 'yellow');
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    log(output, 'green');
    log(`✓ ${description} completed successfully!`, 'green');
    return output;
  } catch (error) {
    log(`✗ Error during ${description}:`, 'red');
    log(error.message, 'red');
    throw error;
  }
}

async function prepareFiles() {
  log('Preparing files for deployment...', 'blue');
  
  // Check if draft files exist and need to be renamed
  const filesToPrepare = [
    { 
      draft: 'src/hooks/useBadgeDashboardSync.ts.draft', 
      final: 'src/hooks/useBadgeDashboardSync.ts' 
    },
    { 
      draft: 'src/components/badges/SynchronizedBadgesTab.tsx.draft',
      final: 'src/components/badges/SynchronizedBadgesTab.tsx'
    }
  ];
  
  // Rename draft files to their final names if needed
  for (const file of filesToPrepare) {
    if (fs.existsSync(file.draft)) {
      log(`Moving ${file.draft} to ${file.final}`, 'yellow');
      fs.renameSync(file.draft, file.final);
    } else if (!fs.existsSync(file.final)) {
      log(`Warning: Neither ${file.draft} nor ${file.final} exists. This file will need to be created.`, 'yellow');
    }
  }
  
  // Update BadgesTab.tsx to use the synchronized component if needed
  const badgesTabPath = 'src/components/badges/BadgesTab.tsx';
  if (fs.existsSync(badgesTabPath)) {
    log(`Checking if ${badgesTabPath} needs to be updated...`, 'blue');
    
    let content = fs.readFileSync(badgesTabPath, 'utf8');
    
    // Only update if it doesn't already use SynchronizedBadgesTab
    if (!content.includes('SynchronizedBadgesTab')) {
      const updatedContent = `import React from 'react';
import SynchronizedBadgesTab from './SynchronizedBadgesTab';

/**
 * BadgesTab component using the enhanced implementation
 * with dashboard data synchronization and badge deduplication
 */
const BadgesTab: React.FC = () => {
  return <SynchronizedBadgesTab />;
};

export default BadgesTab;
`;
      
      log(`Updating ${badgesTabPath} to use SynchronizedBadgesTab`, 'yellow');
      fs.writeFileSync(badgesTabPath, updatedContent, 'utf8');
    } else {
      log(`${badgesTabPath} already uses SynchronizedBadgesTab, no update needed`, 'green');
    }
  } else {
    log(`Warning: ${badgesTabPath} does not exist. This file will need to be created.`, 'yellow');
  }
}

async function deploy() {
  try {
    // Check git status
    log('Checking git status...', 'blue');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (gitStatus.trim()) {
      log('Warning: You have uncommitted changes. These will be included in the deployment.', 'yellow');
      log(gitStatus, 'yellow');
      log('Continuing in 5 seconds... Press Ctrl+C to abort.', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Prepare files for deployment
    await prepareFiles();
    
    // Create and switch to new branch
    try {
      executeCommand(`git checkout -b ${BRANCH_NAME}`, 'Creating new branch');
    } catch (error) {
      // Branch might already exist, try switching to it
      executeCommand(`git checkout ${BRANCH_NAME}`, 'Switching to existing branch');
    }
    
    // Verify required files exist
    const existingFiles = FILES_TO_STAGE.filter(file => fs.existsSync(file));
    
    if (existingFiles.length === 0) {
      throw new Error('No files to stage, aborting deployment');
    }
    
    if (existingFiles.length < FILES_TO_STAGE.length) {
      log(`Warning: Some files are missing. Found ${existingFiles.length}/${FILES_TO_STAGE.length} files.`, 'yellow');
      log(`Missing files: ${FILES_TO_STAGE.filter(file => !existingFiles.includes(file)).join(', ')}`, 'yellow');
    }
    
    // Stage the changed files
    executeCommand(`git add ${existingFiles.join(' ')}`, 'Staging changes');
    
    // Commit changes
    executeCommand(`git commit -m "${COMMIT_MESSAGE}"`, 'Committing changes');
    
    // Push to GitHub
    executeCommand(`git push -u origin ${BRANCH_NAME}`, 'Pushing to GitHub');
    
    log('\n======== MANUAL HEROKU DEPLOYMENT STEPS ========', 'magenta');
    log('1. Deploy to Heroku with:', 'blue');
    log(`   git push heroku ${BRANCH_NAME}:main`, 'cyan');
    log('2. Verify the deployment with:', 'blue');
    log('   heroku logs --tail', 'cyan');
    log('3. Test the badges display:', 'blue');
    log('   - Verify badges with correct progress based on actual audit counts', 'cyan');
    log('   - Confirm no duplicated badges appear in multiple categories', 'cyan');
    log('   - Check that dashboard data is properly synchronized', 'cyan');
    log('=================================================', 'magenta');
    
    log('\nGitHub branch has been created and pushed.', 'green');
    log('Please follow the manual Heroku deployment steps above.', 'green');
    
  } catch (error) {
    log('Deployment failed!', 'red');
    log(error.stack || error.message, 'red');
    process.exit(1);
  }
}

deploy();