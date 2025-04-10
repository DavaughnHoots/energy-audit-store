// Heroku deployment script for badge authentication fix
// This script deploys fixes for issues where badges don't load despite valid authentication tokens

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GIT_BRANCH = 'badge-auth-fix';
const COMMIT_MESSAGE = 'Fix badge authentication issues where badges do not load despite valid tokens';
const HEROKU_APP = 'energy-audit-store';

console.log('Starting deployment of badge authentication fix...');

try {
  // Create a new branch
  console.log(`Creating new branch: ${GIT_BRANCH}`);
  execSync(`git checkout -b ${GIT_BRANCH}`, { stdio: 'inherit' });

  // Add files to staging
  console.log('Adding files to staging...');
  execSync('git add src/hooks/useAuth.ts', { stdio: 'inherit' });
  execSync('git add src/pages/BadgesDiagnosticPage.tsx', { stdio: 'inherit' });
  execSync('git add src/utils/cookieUtils.ts', { stdio: 'inherit' });
  execSync('git add src/services/tokenInfoService.ts', { stdio: 'inherit' });
  execSync('git add backend/src/routes/auth-token.ts', { stdio: 'inherit' });
  execSync('git add backend/src/server.ts', { stdio: 'inherit' });
  execSync('git add energy-audit-vault/operations/bug-fixes/badge-auth-issues-fix.md', { stdio: 'inherit' });

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
  console.log('1. Enhanced useAuth.ts to recover user profile when token exists but user data is missing');
  console.log('2. Improved BadgesDiagnosticPage.tsx with token debugging information');
  console.log('3. Added documentation for the fix in the Energy Audit Vault');

  // Checkout back to main branch
  console.log('Checking out back to main branch...');
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('Deployment failed:');
  console.error(error.message);
  process.exit(1);
}
