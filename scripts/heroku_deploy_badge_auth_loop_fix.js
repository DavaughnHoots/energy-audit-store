// Heroku deployment script for badge authentication loop fix
// This script deploys fixes for the infinite recovery loop in badge authentication

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GIT_BRANCH = 'badge-auth-loop-fix';
const COMMIT_MESSAGE = 'Fix badge authentication infinite recovery loop with improved token handling';
const HEROKU_APP = 'energy-audit-store';

console.log('Starting deployment of badge auth loop fix...');

try {
  // Create a new branch
  console.log(`Creating new branch: ${GIT_BRANCH}`);
  execSync(`git checkout -b ${GIT_BRANCH}`, { stdio: 'inherit' });

  // Add files to staging
  console.log('Adding files to staging...');
  execSync('git add src/services/tokenInfoService.ts', { stdio: 'inherit' });
  execSync('git add src/hooks/useAuth.ts', { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync(`git commit -m "${COMMIT_MESSAGE}"`, { stdio: 'inherit' });

  // Push to GitHub
  console.log('Pushing to GitHub...');
  execSync(`git push -u origin ${GIT_BRANCH}`, { stdio: 'inherit' });

  // Deploy to Heroku
  console.log(`Deploying to Heroku app: ${HEROKU_APP}...`);
  execSync(`git push https://git.heroku.com/${HEROKU_APP}.git ${GIT_BRANCH}:main -f`, {
    stdio: 'inherit'
  });

  console.log('Deployment completed successfully!');
  console.log('Changes deployed:');
  console.log('1. Enhanced token info service to handle various response formats');
  console.log('2. Added recovery attempt tracking to prevent infinite loops');
  console.log('3. Improved error handling and debug logging in both components');

  // Checkout back to main branch
  console.log('Checking out back to main branch...');
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('Deployment failed:');
  console.error(error.message);
  process.exit(1);
}
