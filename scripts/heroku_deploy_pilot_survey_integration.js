/**
 * Deployment script for integrating Pilot Study FAQ with Google Forms survey
 * 
 * This script deploys the changes for the pilot study survey integration,
 * which updates the SurveyTab component to embed the Google Form.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Pilot Study Survey Integration deployment to Heroku...');

// Ensure we're on the main branch
console.log('Checking out main branch...');
try {
  execSync('git checkout main', { stdio: 'inherit' });
} catch (error) {
  console.error('Error checking out main branch:', error);
  process.exit(1);
}

// Create a new branch for the update
const branchName = `pilot-survey-integration-${new Date().toISOString().replace(/[:.]/g, '-')}`;
console.log(`Creating new branch: ${branchName}...`);
try {
  execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error creating new branch:', error);
  process.exit(1);
}

console.log('Committing changes...');
try {
  // Add all relevant files
  execSync('git add src/components/dashboard2/SurveyTab.tsx', { stdio: 'inherit' });
  execSync('git add src/pages/PilotStudyFAQPage.tsx', { stdio: 'inherit' });
  execSync('git add energy-audit-vault/frontend/components/SurveyTabGoogleFormEmbed.md', { stdio: 'inherit' });
  execSync('git add energy-audit-vault/operations/enhancements/pilot-survey-integration-plan.md', { stdio: 'inherit' });
  
  // Commit with descriptive message
  execSync('git commit -m "Integrate Pilot Study FAQ with Google Forms survey"', { stdio: 'inherit' });
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

console.log('Pilot Study Survey Integration successfully deployed to Heroku!');
console.log('Please verify the following:');
console.log('1. Check the SurveyTab in the dashboard has the Google Form embedded');
console.log('2. Verify the links between the FAQ page and Survey work correctly');
console.log('3. Test the responsiveness of the embedded form on different devices');
console.log('4. Confirm analytics are tracking form interactions');
