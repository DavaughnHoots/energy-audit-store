/**
 * Deploy script to update product estimation configuration files on Heroku
 * 
 * This script deploys the configuration files for product estimations
 * to ensure they're available in the correct locations on Heroku.
 * 
 * Usage: node scripts/deploy_product_estimation_configs.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a build trigger to force a deployment
function createBuildTrigger() {
  console.log('Creating build trigger...');
  
  const triggerFilePath = '.build-trigger';
  const timestamp = new Date().toISOString();
  
  fs.writeFileSync(triggerFilePath, `Build triggered at ${timestamp} for Product Estimation Configuration update\n`, { flag: 'a' });
  
  console.log(`✅ Build trigger created at ${timestamp}`);
}

// Commit changes
function commitChanges() {
  console.log('Committing changes...');
  
  try {
    // Add modified files
    execSync('git add public/data/product-estimations.json public/product-estimations.json .build-trigger');
    
    // Commit with descriptive message
    execSync('git commit -m "Add product estimation configuration files for dehumidifiers"');
    
    console.log('✅ Changes committed successfully!');
    return true;
  } catch (error) {
    console.error('Error committing changes:', error.message);
    console.log('You may need to manually commit the changes:');
    console.log('git add public/data/product-estimations.json public/product-estimations.json .build-trigger');
    console.log('git commit -m "Add product estimation configuration files for dehumidifiers"');
    return false;
  }
}

// Deploy to Heroku
function deployToHeroku() {
  console.log('Deploying to Heroku...');
  
  try {
    // Push to Heroku
    execSync('git push heroku HEAD:main', { stdio: 'inherit' });
    
    console.log('✅ Deployment to Heroku completed successfully!');
    return true;
  } catch (error) {
    console.error('Error deploying to Heroku:', error.message);
    console.log('Please follow the manual deployment procedure:');
    console.log('git push heroku HEAD:main');
    return false;
  }
}

// Main function
function main() {
  console.log('Starting deployment for Product Estimation Configuration files...');
  
  // Verify config files exist
  if (!fs.existsSync('public/data/product-estimations.json')) {
    console.error('ERROR: public/data/product-estimations.json not found');
    process.exit(1);
  }
  
  if (!fs.existsSync('public/product-estimations.json')) {
    console.error('ERROR: public/product-estimations.json not found');
    process.exit(1);
  }
  
  console.log('✅ Configuration files verified.');

  // Create build trigger and deploy
  createBuildTrigger();
  
  // Deploy
  const committed = commitChanges();
  if (committed) {
    deployToHeroku();
  }
  
  console.log('\n✅ Product Estimation Configuration deployment process completed!');
}

// Execute the main function
main();
