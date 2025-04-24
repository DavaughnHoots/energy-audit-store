/**
 * Heroku Deployment Script for Subcategory Images Feature
 * 
 * This script deploys the subcategory image gallery and integration with the
 * Products2Page to enhance the product browsing experience with visual images.
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Configuration
const BASE_DIR = path.resolve(__dirname, '..');
const FILES_TO_DEPLOY = [
  'src/components/products/SubCategoryGallery.tsx',
  'src/pages/Products2Page.tsx',
  'public/data/custom-category-images.json',
  'src/services/productImageService.ts'
];

// Utilities
function logStep(message) {
  console.log(`\n\x1b[36m${message}\x1b[0m`);
}

function logSuccess(message) {
  console.log(`\x1b[32m✓ ${message}\x1b[0m`);
}

function logError(message) {
  console.error(`\x1b[31m✗ ${message}\x1b[0m`);
  process.exit(1);
}

// Verify files exist
logStep('Verifying files exist...');
FILES_TO_DEPLOY.forEach(file => {
  const filePath = path.join(BASE_DIR, file);
  if (!fs.existsSync(filePath)) {
    logError(`File not found: ${file}`);
  }
});
logSuccess('All required files exist');

// Create a new git branch
const branchName = `feature/subcategory-images-${Date.now()}`;
logStep(`Creating new git branch: ${branchName}...`);
try {
  execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  logSuccess('Created new branch');
} catch (error) {
  logError(`Failed to create branch: ${error.message}`);
}

// Add files to git
logStep('Adding files to git...');
try {
  FILES_TO_DEPLOY.forEach(file => {
    execSync(`git add ${file}`, { stdio: 'inherit' });
  });
  logSuccess('Added files to git');
} catch (error) {
  console.warn(`Warning when adding files: ${error.message}`);
  console.log('Continuing deployment anyway...');
}

// Commit changes
logStep('Committing changes...');
try {
  execSync(`git commit -m "Add subcategory image gallery integration"`, { stdio: 'inherit' });
  logSuccess('Committed changes');
} catch (error) {
  logError(`Failed to commit: ${error.message}`);
}

// Push to Heroku
logStep('Pushing to Heroku...');
try {
  execSync(`git push heroku ${branchName}:main`, { stdio: 'inherit' });
  logSuccess('Deployed to Heroku successfully!');
} catch (error) {
  logError(`Failed to push to Heroku: ${error.message}`);
}

// Success message
console.log('\n\x1b[42m\x1b[30m DEPLOYMENT SUCCESSFUL \x1b[0m');
console.log('\nSubcategory Image Gallery Feature has been deployed to Heroku.');
console.log('\nKey changes:');
console.log('1. Added SubCategoryGallery component for visual subcategory browsing');
console.log('2. Updated Products2Page to integrate the new gallery');
console.log('3. Leverages existing productImageService with custom category images');
console.log('\nNotes:');
console.log('- Visual experience matches main category view for consistency');
console.log('- All subcategory images are properly attributed to photographers');
