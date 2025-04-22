/**
 * Deploy script for product estimation schema fix
 * 
 * This script deploys the updated configuration files with the schemaVersion and regions
 * needed for the product estimation service to work correctly.
 * 
 * Usage: node scripts/deploy_product_estimations_schema_fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a build trigger to force a deployment
function createBuildTrigger() {
  console.log('Creating build trigger...');
  
  const triggerFilePath = '.build-trigger';
  const timestamp = new Date().toISOString();
  
  fs.writeFileSync(triggerFilePath, `Build triggered at ${timestamp} for Product Estimation Schema Fix\n`, { flag: 'a' });
  
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
      if (!config1.regions || !config1.regions['US-avg'] || !config1.regions['US-avg'].electricityRatesUSDPerkWh) {
        console.error(`❌ Missing regions or electricity rates in ${configPath1}`);
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
      if (!config2.regions || !config2.regions['US-avg'] || !config2.regions['US-avg'].electricityRatesUSDPerkWh) {
        console.error(`❌ Missing regions or electricity rates in ${configPath2}`);
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
    execSync('git commit -m "Fix product estimation configuration schema and add required regions"');
    
    console.log('✅ Changes committed successfully!');
    return true;
  } catch (error) {
    console.error('Error committing changes:', error.message);
    console.log('You may need to manually commit the changes:');
    console.log('git add public/data/product-estimations.json public/product-estimations.json .build-trigger');
    console.log('git commit -m "Fix product estimation configuration schema and add required regions"');
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
  console.log('Starting deployment process for Product Estimation Schema Fix...');
  
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
  
  console.log('\n✅ Product Estimation Schema Fix deployment process completed!');
}

// Execute the main function
main();
