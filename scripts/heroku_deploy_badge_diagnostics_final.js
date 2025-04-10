// Heroku deployment script for badge diagnostics page (final version)
// This script creates all needed files with proper dependencies and deploys the badge diagnostics page

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GIT_BRANCH = 'badge-diagnostics-final';
const COMMIT_MESSAGE = 'Add complete badge diagnostics page with all dependencies fixed';
const HEROKU_APP = 'energy-audit-store';

console.log('Starting deployment of complete badge diagnostics page (final version)...');

try {
  // Make sure we're on main branch first
  console.log('Switching to main branch to start fresh...');
  execSync('git checkout main', { stdio: 'inherit' });
  
  // Create a new branch
  console.log(`Creating new branch: ${GIT_BRANCH}`);
  execSync(`git checkout -b ${GIT_BRANCH}`, { stdio: 'inherit' });

  // Add all the files to staging
  console.log('Adding all modified files to staging...');
  execSync('git add src/services/apiClient.ts', { stdio: 'inherit' });
  execSync('git add src/services/tokenInfoService.ts', { stdio: 'inherit' });
  execSync('git add src/pages/BadgesDiagnosticPage.tsx', { stdio: 'inherit' });
  execSync('git add src/App.tsx', { stdio: 'inherit' });
  
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
  console.log('New diagnostic page is available at: /diagnostics/badges');
  console.log('Changes deployed:');
  console.log('1. Badge diagnostics page with token and badge inspection');
  console.log('2. Token info service with apiClient dependency');
  console.log('3. Lazy-loaded route for improved performance');

  // Checkout back to main branch
  console.log('Checking out back to main branch...');
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('Deployment failed:');
  console.error(error.message);
  process.exit(1);
}
