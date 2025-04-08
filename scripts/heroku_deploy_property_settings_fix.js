// Deploy property settings fix to Heroku
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Deploying property settings fix to Heroku...');

// Ensure we're in the right directory
const rootDir = process.cwd();
console.log('Current directory:', rootDir);

try {
  // Create a new git branch
  const branchName = `fix-property-settings-${Date.now()}`;
  console.log(`Creating branch: ${branchName}`);
  execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });

  // Add all changed files
  console.log('Adding changed files...');
  execSync('git add .', { stdio: 'inherit' });

  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix property settings form data submission"', { stdio: 'inherit' });

  // Push to Heroku
  console.log('Pushing to Heroku...');
  execSync('git push heroku HEAD:main --force', { stdio: 'inherit' });

  // Switch back to main branch
  console.log('Switching back to main branch...');
  execSync('git checkout main', { stdio: 'inherit' });

  console.log('Property settings fix deployed successfully!');
} catch (error) {
  console.error('Error deploying property settings fix:', error.message);
  process.exit(1);
}
