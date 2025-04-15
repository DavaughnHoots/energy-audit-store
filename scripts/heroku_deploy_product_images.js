/**
 * Heroku Deployment Script for Product Images Feature
 * 
 * This script deploys the product image integration feature to Heroku.
 * It includes:
 * - New productImageService for fetching images from Unsplash
 * - Updates to ProductDetailModal for displaying dynamic images
 * - Documentation for the feature
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Configuration
const BASE_DIR = path.resolve(__dirname, '..');
const FILES_TO_DEPLOY = [
  'src/services/productImageService.ts',
  'src/components/products/ProductDetailModal.tsx',
  'energy-audit-vault/frontend/features/product-image-integration.md',
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

// Check for Unsplash API key
logStep('Checking for Unsplash API key...');
const productImageServicePath = path.join(BASE_DIR, 'src/services/productImageService.ts');
const serviceContent = fs.readFileSync(productImageServicePath, 'utf8');

if (serviceContent.includes('YOUR_UNSPLASH_ACCESS_KEY')) {
  console.log('\x1b[33m⚠ Warning: Using placeholder Unsplash API key\x1b[0m');
  console.log('   For production, replace with a valid key or environment variable');
}

// Create a new git branch
const branchName = `feature/product-images-${Date.now()}`;
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
  logError(`Failed to add files: ${error.message}`);
}

// Commit changes
logStep('Committing changes...');
try {
  execSync(`git commit -m "Add product image integration feature"`, { stdio: 'inherit' });
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
console.log('\nProduct Image Feature has been deployed to Heroku.');
console.log('\nKey changes:');
console.log('1. Added dynamic image loading for products');
console.log('2. Implemented Unsplash API integration with caching');
console.log('3. Enhanced product detail modal with image loading states');
console.log('\nNotes:');
console.log('- Monitor Unsplash API usage to stay within rate limits');
console.log('- Consider upgrading to a paid Unsplash plan for production use');
