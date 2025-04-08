/**
 * Deployment script for Education Modal Fix
 * 
 * This script deploys the fix for the ResourceDetailModal component
 * which had JSX errors with mismatched DialogContent tags and duplicate DialogTitle elements
 * 
 * The fix specifically:
 * 1. Removes the duplicate return statements in ResourceDetailModal
 * 2. Removes the duplicate DialogTitle element
 * 3. Fixes trailing whitespace issues
 * 
 * Execution: node scripts/heroku_deploy_education_modal_fix.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const HEROKU_APP_NAME = 'energy-audit-store';
const BRANCH_NAME = 'fix/education-modal';
const COMMIT_MESSAGE = 'Fix ResourceDetailModal JSX structure and whitespace issues';

// Deployment Log
console.log('Starting deployment of Education Modal Fix...');
console.log('================================================');

try {
  // 1. Create and checkout new branch
  console.log(`Creating branch: ${BRANCH_NAME}`);
  execSync(`git checkout -b ${BRANCH_NAME}`, { stdio: 'inherit' });

  // 2. Add changes
  console.log('Adding files to staging...');
  execSync('git add src/components/education/ResourceDetailModal.tsx', { stdio: 'inherit' });

  // 3. Commit changes
  console.log(`Committing changes: "${COMMIT_MESSAGE}"`);
  execSync(`git commit -m "${COMMIT_MESSAGE}"`, { stdio: 'inherit' });

  // 4. Push to GitHub
  console.log('Pushing to GitHub...');
  execSync(`git push origin ${BRANCH_NAME}`, { stdio: 'inherit' });

  // 5. Deploy to Heroku
  console.log(`Deploying to Heroku app: ${HEROKU_APP_NAME}`);
  execSync(`git push heroku ${BRANCH_NAME}:main -f`, { stdio: 'inherit' });

  // 6. Return to main branch
  console.log('Returning to main branch...');
  execSync('git checkout main', { stdio: 'inherit' });

  console.log('================================================');
  console.log('Deployment completed successfully!');
  console.log(`The fix for ResourceDetailModal has been deployed to Heroku: ${HEROKU_APP_NAME}`);
  console.log('Changes:');
  console.log('- Fixed duplicate return statements');
  console.log('- Removed duplicate DialogTitle element');
  console.log('- Fixed trailing whitespace issues');

} catch (error) {
  console.error('Deployment failed with error:');
  console.error(error.message);
  console.log('Attempting to return to main branch...');
  try {
    execSync('git checkout main', { stdio: 'inherit' });
  } catch (checkoutError) {
    console.error('Failed to return to main branch:', checkoutError.message);
  }
  process.exit(1);
}
