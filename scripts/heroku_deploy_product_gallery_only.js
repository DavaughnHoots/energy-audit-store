/**
 * Heroku Deployment Script: Product Gallery Fix Only
 * 
 * This script deploys the fix for infinite loading issues in the ProductGallery.tsx component only.
 * Use this script when you need to fix the ProductGallery component urgently without waiting for
 * the ProductDetailModal component fix.
 * 
 * The script:
 * 1. Copies the fixed version of the ProductGallery component to its location
 * 2. Updates the build trigger file to prompt a Heroku rebuild
 * 3. Commits and pushes changes to Heroku
 * 
 * Usage: node scripts/heroku_deploy_product_gallery_only.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const copyFileAsync = promisify(fs.copyFile);

// Define paths
const PRODUCT_GALLERY_PATH = path.join(__dirname, '../src/components/products/ProductGallery.tsx');
const PRODUCT_GALLERY_FIXED_PATH = path.join(__dirname, '../src/components/products/ProductGallery.fixed.tsx');
const BUILD_TRIGGER_PATH = path.join(__dirname, '../.build-trigger');

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Print colored message
function printColored(message, color) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

// Execute shell command and return output
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Create backup of a file
async function createBackup(filePath) {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  try {
    await copyFileAsync(filePath, backupPath);
    printColored(`Created backup at ${path.basename(backupPath)}`, 'green');
    return true;
  } catch (error) {
    printColored(`Warning: Could not create backup for ${path.basename(filePath)}: ${error.message}`, 'yellow');
    return false;
  }
}

// Update build trigger file to force Heroku rebuild
async function updateBuildTrigger() {
  try {
    const timestamp = new Date().toISOString();
    await writeFileAsync(BUILD_TRIGGER_PATH, `Build triggered at: ${timestamp}\nFix: Product Gallery infinite loading (gallery component only)`);
    printColored('✅ Build trigger file updated', 'green');
    return true;
  } catch (error) {
    printColored(`❌ Failed to update build trigger: ${error.message}`, 'red');
    return false;
  }
}

// Copy fixed component to its target location
async function applyComponentFix() {
  if (!fs.existsSync(PRODUCT_GALLERY_FIXED_PATH)) {
    printColored(`❌ Source file not found: ${path.basename(PRODUCT_GALLERY_FIXED_PATH)}`, 'red');
    return false;
  }
  
  try {
    // Create backup of original file
    await createBackup(PRODUCT_GALLERY_PATH);
    
    // Copy fixed version
    await copyFileAsync(PRODUCT_GALLERY_FIXED_PATH, PRODUCT_GALLERY_PATH);
    printColored(`✅ Successfully applied fix to ${path.basename(PRODUCT_GALLERY_PATH)}`, 'green');
    return true;
  } catch (error) {
    printColored(`❌ Failed to apply fix to ${path.basename(PRODUCT_GALLERY_PATH)}: ${error.message}`, 'red');
    return false;
  }
}

// Deploy changes to Heroku
async function deployToHeroku() {
  printColored('\nInitiating Heroku deployment...', 'cyan');
  
  // Stage modified files
  execCommand('git add src/components/products/ProductGallery.tsx .build-trigger');
  
  // Commit changes
  execCommand('git commit -m "Fix: Product Gallery infinite loading issues (gallery component only)"');
  
  // Push to Heroku
  printColored('\nPushing changes to Heroku...', 'cyan');
  const pushResult = execCommand('git push heroku HEAD:main');
  
  if (pushResult) {
    printColored('\n🚀 Successfully deployed to Heroku!', 'green');
    return true;
  } else {
    printColored('\n❌ Failed to push to Heroku', 'red');
    return false;
  }
}

// Main function to orchestrate the deployment
async function deploy() {
  printColored('\n=== Product Gallery Infinite Loading Fix Deployment (Gallery Only) ===', 'magenta');
  
  printColored('\nApplying component fix...', 'cyan');
  
  // Apply fix to the component
  const galleryFixed = await applyComponentFix();
  
  if (!galleryFixed) {
    printColored('\n❌ Cannot proceed with deployment due to component fix failure', 'red');
    process.exit(1);
  }
  
  // Update build trigger file
  const triggerUpdated = await updateBuildTrigger();
  if (!triggerUpdated) {
    printColored('\n❌ Cannot proceed with deployment due to build trigger update failure', 'red');
    process.exit(1);
  }
  
  // Deploy to Heroku
  const deployed = await deployToHeroku();
  if (!deployed) {
    printColored('\n❌ Deployment to Heroku failed', 'red');
    process.exit(1);
  }
  
  printColored('\n✅ Partial deployment completed successfully!', 'green');
  printColored(`\nNOTE: This deployment only fixes the ProductGallery component.`, 'yellow');
  printColored(`The ProductDetailModal component still needs to be fixed in a future update.`, 'yellow');
  printColored('\nVerification steps:', 'cyan');
  printColored('1. Open the application and navigate to the Products2Page', 'cyan');
  printColored('2. Select a category and subcategory to verify no infinite loading occurs', 'cyan');
  printColored('3. Check browser console for any reduced API request volume', 'cyan');
}

// Execute deployment process
deploy().catch(error => {
  printColored(`\n❌ Unexpected error during deployment: ${error.message}`, 'red');
  process.exit(1);
});
