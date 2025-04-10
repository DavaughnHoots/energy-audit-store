// Heroku deployment script for badge real implementation
// This script deploys the changes to connect badges with real API data

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GIT_BRANCH = 'badge-real-implementation';
const COMMIT_MESSAGE = 'Connect badges to real API data and add diagnostics page';
const HEROKU_APP = 'energy-audit-store';

console.log('Starting deployment of badge real implementation...');

try {
  // Create a new branch
  console.log(`Creating new branch: ${GIT_BRANCH}`);
  execSync(`git checkout -b ${GIT_BRANCH}`, { stdio: 'inherit' });

  // Add files to staging
  console.log('Adding files to staging...');
  execSync('git add src/components/badges/RealBadgesTab.tsx', { stdio: 'inherit' });
  execSync('git add src/components/badges/BadgesTab.tsx', { stdio: 'inherit' });
  execSync('git add src/pages/BadgesDiagnosticPage.tsx', { stdio: 'inherit' });
  execSync('git add src/App.tsx', { stdio: 'inherit' });
  execSync('git add energy-audit-vault/frontend/features/badges-real-implementation.md', { stdio: 'inherit' });

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
  console.log('1. Replaced placeholder badge data with real API integration');
  console.log('2. Added BadgesDiagnosticPage for badge testing and debugging');
  console.log('3. Added proper null handling and error states');
  console.log('4. Updated documentation in the Energy Audit Vault');

  // Checkout back to main branch
  console.log('Checking out back to main branch...');
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('Deployment failed:');
  console.error(error.message);
  process.exit(1);
}
