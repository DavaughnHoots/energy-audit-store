/**
 * Deployment script for updating the Pilot Study FAQ page
 * 
 * This script directly deploys updated content for the Pilot Study FAQ page to Heroku.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Pilot Study FAQ update deployment to Heroku...');

// Ensure we're on the main branch
console.log('Checking out main branch...');
try {
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('Error checking out main branch:', error);
  process.exit(1);
}

// Create a new branch for the update
const branchName = `pilot-faq-update-${new Date().toISOString().replace(/[:.]/g, '-')}`;
console.log(`Creating new branch: ${branchName}...`);
try {
  execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error creating new branch:', error);
  process.exit(1);
}

console.log('Committing changes...');
try {
  execSync('git add src/pages/PilotStudyFAQPage.tsx', { stdio: 'inherit' });
  execSync('git add energy-audit-vault/frontend/pages/PilotStudyFAQPage.md', { stdio: 'inherit' });
  execSync('git commit -m "Update Pilot Study FAQ page with new content"', { stdio: 'inherit' });
} catch (error) {
  console.error('Error committing changes:', error);
  process.exit(1);
}

console.log('Pushing to GitHub...');
try {
  execSync(`git push --set-upstream origin ${branchName}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error pushing to GitHub:', error);
  process.exit(1);
}

console.log('Deploying to Heroku...');
try {
  execSync('git push heroku HEAD:main', { stdio: 'inherit' });
} catch (error) {
  console.error('Error deploying to Heroku:', error);
  process.exit(1);
}

console.log('Checking out main branch again...');
try {
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('Error checking out main branch:', error);
  process.exit(1);
}

console.log('Pilot Study FAQ update successfully deployed to Heroku!');
