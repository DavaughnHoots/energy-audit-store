/**
 * Deploy script for product estimation reference data fix
 * 
 * This script creates the build trigger and deploys the updated product estimation
 * configuration files with the correct schema structure including referenceData.
 * 
 * Usage: node scripts/deploy_product_estimation_reference_data_fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a build trigger to force a deployment
function createBuildTrigger() {
  console.log('Creating build trigger...');
  
  const triggerFilePath = '.build-trigger';
  const timestamp = new Date().toISOString();
  
  fs.writeFileSync(triggerFilePath, `Build triggered at ${timestamp} for Product Estimation Reference Data Fix\n`, { flag: 'a' });
  
  console.log(`✅ Build trigger created at ${timestamp}`);
}

// Verify configuration files
function verifyConfigFiles() {
  console.log('Verifying configuration files...');
  
  const configPath1 = 'public/data/product-estimations.json';
  const configPath2 = 'public/product-estimations.json';
  
  let success = true;
  
  // Check if files exist
  if (!fs.existsSync(configPath1)) {
    console.error(`❌ Configuration file missing: ${configPath1}`);
    success = false;
  } else {
    try {
      const config1 = JSON.parse(fs.readFileSync(configPath1, 'utf8'));
      if (!config1.schemaVersion) {
        console.error(`❌ Missing schemaVersion in ${configPath1}`);
        success = false;
      }
      if (!config1.referenceData || !config1.referenceData.electricityRatesUSDPerkWh) {
        console.error(`❌ Missing referenceData or electricity rates in ${configPath1}`);
        success = false;
      }
      console.log(`✅ Configuration verified: ${configPath1}`);
    } catch (error) {
      console.error(`❌ Error parsing ${configPath1}: ${error.message}`);
      success = false;
    }
  }
  
  if (!fs.existsSync(configPath2)) {
    console.error(`❌ Configuration file missing: ${configPath2}`);
    success = false;
  } else {
    try {
      const config2 = JSON.parse(fs.readFileSync(configPath2, 'utf8'));
      if (!config2.schemaVersion) {
        console.error(`❌ Missing schemaVersion in ${configPath2}`);
        success = false;
      }
      if (!config2.referenceData || !config2.referenceData.electricityRatesUSDPerkWh) {
        console.error(`❌ Missing referenceData or electricity rates in ${configPath2}`);
        success = false;
      }
      console.log(`✅ Configuration verified: ${configPath2}`);
    } catch (error) {
      console.error(`❌ Error parsing ${configPath2}: ${error.message}`);
      success = false;
    }
  }
  
  return success;
}

// Commit changes
function commitChanges() {
  console.log('Committing changes...');
  
  try {
    // Add modified files
    execSync('git add public/data/product-estimations.json public/product-estimations.json .build-trigger');
    
    // Commit with descriptive message
    execSync('git commit -m "Fix product estimation configuration with referenceData and electricity rates"');
    
    console.log('✅ Changes committed successfully!');
    return true;
  } catch (error) {
    console.error('Error committing changes:', error.message);
    console.log('You may need to manually commit the changes:');
    console.log('git add public/data/product-estimations.json public/product-estimations.json .build-trigger');
    console.log('git commit -m "Fix product estimation configuration with referenceData and electricity rates"');
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
  console.log('Starting deployment process for Product Estimation Reference Data Fix...');
  
  // Verify configuration files
  const configVerified = verifyConfigFiles();
  if (!configVerified) {
    console.error('Failed to verify configuration files. Deployment aborted.');
    process.exit(1);
  }
  
  // Create build trigger and deploy
  createBuildTrigger();
  
  // Deploy
  const committed = commitChanges();
  if (committed) {
    deployToHeroku();
  }
  
  console.log('\n✅ Product Estimation Reference Data Fix deployment process completed!');
}

// Execute the main function
main();
