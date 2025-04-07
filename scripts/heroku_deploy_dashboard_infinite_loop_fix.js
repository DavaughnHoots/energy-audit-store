/**
 * Deployment script for dashboard infinite loop fix
 * Fixes the issue with React's infinite re-rendering due to dependency loop
 * Implements better data processing for financial values in charts
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const BRANCH_NAME = 'feature/dashboard-infinite-loop-fix';
const SOURCE_BRANCH = 'feature/unified-recommendation-system'; 
const COMMIT_MESSAGE = 'Fix dashboard infinite API calls loop and data processing';

// Ensure we're in the project root
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

console.log(`🚀 Starting dashboard infinite loop fix deployment from ${SOURCE_BRANCH}...`);

try {
  // 1. Create and checkout a new branch from the current branch
  console.log(`Creating new branch: ${BRANCH_NAME} from ${SOURCE_BRANCH}...`);
  try {
    execSync(`git checkout -b ${BRANCH_NAME} ${SOURCE_BRANCH}`, { stdio: 'inherit' });
  } catch (error) {
    // Branch might already exist, try to check it out
    console.log(`Branch might already exist, trying to check it out...`);
    execSync(`git checkout ${BRANCH_NAME}`, { stdio: 'inherit' });
    
    // Make sure it's up to date with the source branch
    console.log(`Updating branch from ${SOURCE_BRANCH}...`);
    execSync(`git merge ${SOURCE_BRANCH} --no-edit`, { stdio: 'inherit' });
  }

  // 2. Check if we've already committed our changes
  const status = execSync('git status --porcelain').toString();
  if (status.trim() === '') {
    console.log('No changes to commit. Changes might already be applied.');
  } else {
    // 3. Add changes and commit
    console.log('Adding changed files...');
    execSync('git add .', { stdio: 'inherit' });
    
    console.log(`Committing changes: ${COMMIT_MESSAGE}`);
    execSync(`git commit -m "${COMMIT_MESSAGE}"`, { stdio: 'inherit' });
  }

  // 4. Deploy to Heroku
  console.log('Deploying to Heroku...');
  execSync('git push heroku feature/dashboard-infinite-loop-fix:main --force', { stdio: 'inherit' });
  
  console.log('✅ Dashboard infinite loop fix deployed successfully!');
  console.log('📊 Main fixes:');
  console.log('  - Fixed infinite API calls loop');
  console.log('  - Improved data processing for financial values');
  console.log('  - Reduced unnecessary re-renders');
  console.log('  - Added request deduplication');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
