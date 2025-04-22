/**
 * Heroku deployment script for the Product Estimation System
 * 
 * This script deploys the necessary files for the Product Estimation System feature
 * which includes estimators for product financial values (price, savings, ROI)
 * 
 * Usage: node scripts/heroku_deploy_product_estimation.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Files to be deployed - code files only (exclude documentation)
const filesToDeploy = [
  // Core files
  'src/services/productEstimation/types.ts',
  'src/services/productEstimation/estimatorFactory.ts',
  'src/services/productEstimation/DehumidifierEstimator.ts',
  'src/services/productEstimationService.ts',
  'src/schemas/productEstimationSchema.ts',
  'public/data/product-estimations.json',
  
  // Modified components
  'src/components/products/ProductDetailModal.tsx',
];

// Documentation files (handled separately to avoid gitignore issues)
const documentationFiles = [
  'energy-audit-vault/frontend/features/product-estimation-system.md',
  'energy-audit-vault/operations/deployment/product-estimation-deployment.md'
];

// Validation function to ensure all files exist
function validateFiles() {
  console.log('Validating files...');
  
  const missingFiles = [];
  
  // Check core files
  filesToDeploy.forEach(file => {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  });
  
  console.log('Checking documentation files (optional)...');
  // Check documentation files but don't fail if missing
  documentationFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`  - Documentation file not found: ${file} (will continue anyway)`);
    } else {
      console.log(`  - Documentation file found: ${file}`);
    }
  });
  
  if (missingFiles.length > 0) {
    console.error('Error: The following required files are missing:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    process.exit(1);
  }
  
  console.log('All core files validated successfully!');
}

// Function to commit changes
function commitChanges() {
  console.log('Committing changes...');
  
  try {
    // Add all the core files to git
    execSync(`git add ${filesToDeploy.join(' ')}`);
    
    // Commit with descriptive message
    execSync('git commit -m "Add Product Estimation System for calculating missing product values"');
    
    console.log('Changes committed successfully!');
  } catch (error) {
    console.error('Error committing changes:', error.message);
    console.log('\nThis may be due to line ending differences or other git issues.');
    console.log('You may need to manually add and commit the files:');
    console.log('git add [files]');
    console.log('git commit -m "Add Product Estimation System for calculating missing product values"');
    process.exit(1);
  }
}

// Function to push to Heroku
function deployToHeroku() {
  console.log('Deploying to Heroku...');
  
  try {
    // Push to Heroku
    execSync('git push heroku HEAD:main');
    
    console.log('Deployment to Heroku completed successfully!');
  } catch (error) {
    console.error('Error deploying to Heroku:', error.message);
    console.log('\nPlease follow the manual deployment procedure instead:');
    console.log('1. Ensure all changes are committed');
    console.log('2. Run: git push heroku HEAD:main');
    process.exit(1);
  }
}

// Function to create a trigger file for build
function createBuildTrigger() {
  console.log('Creating build trigger...');
  
  const triggerFilePath = '.build-trigger';
  const timestamp = new Date().toISOString();
  
  fs.writeFileSync(triggerFilePath, `Build triggered at ${timestamp} for Product Estimation System deployment\n`, { flag: 'a' });
  
  console.log(`Build trigger created at ${timestamp}!`);
}

// Main function
function main() {
  console.log('Starting deployment of Product Estimation System...');
  console.log('⚠️ NOTE: Documentation files in energy-audit-vault directory may be ignored by git');
  console.log('   This is normal and will not affect functionality.');
  console.log('');
  
  // Run the steps in sequence
  validateFiles();
  createBuildTrigger();
  commitChanges();
  deployToHeroku();
  
  console.log('\nProduct Estimation System deployment completed!');
  console.log('The system provides automatic estimation of product values such as:');
  console.log('- Price estimates for products');
  console.log('- Annual savings calculations');
  console.log('- ROI and payback period');
  console.log('- Energy efficiency metrics');
  console.log('\nThe system is now available in production.');
}

// Execute the main function
main();
