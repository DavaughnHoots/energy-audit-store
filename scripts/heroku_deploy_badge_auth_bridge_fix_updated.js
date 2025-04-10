// Heroku deployment script for badge authentication bridge fix (updated)
// This script deploys fixes to bridge the authentication system with the badge service

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GIT_BRANCH = 'badge-auth-bridge-fix-updated';
const COMMIT_MESSAGE = 'Fix badge authentication integration with main auth system (updated with getUserLevel)';
const HEROKU_APP = 'energy-audit-store';

console.log('Starting deployment of updated badge auth bridge fix...');

try {
  // Create a new branch
  console.log(`Creating new branch: ${GIT_BRANCH}`);
  execSync(`git checkout -b ${GIT_BRANCH}`, { stdio: 'inherit' });

  // Add files to staging
  console.log('Adding files to staging...');
  execSync('git add src/services/badgeService.ts', { stdio: 'inherit' });
  execSync('git add src/components/badges/BadgesTab.tsx', { stdio: 'inherit' });
  execSync('git add src/services/tokenInfoService.ts', { stdio: 'inherit' });
  
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
  console.log('1. Enhanced badge service with getUserLevel public method fix');
  console.log('2. Added fallback user ID extraction from tokens');
  console.log('3. Added robust badge data loading in BadgesTab component');

  // Checkout back to main branch
  console.log('Checking out back to main branch...');
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('Deployment failed:');
  console.error(error.message);
  process.exit(1);
}
